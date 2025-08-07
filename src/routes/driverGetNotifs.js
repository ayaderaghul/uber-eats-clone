// routes/notifications.js (or inside your controller)
const express = require('express');
const router = express.Router();
const rabbitmq = require('../config/rabbitmq');
const redisClient = require('../config/redis')
const Order = require('../models/Order')
const {producer} = require('../config/kafka');


// GET /api/notifications/:driverId
router.get('/:driverId', async (req, res) => {
  const { driverId } = req.params;
  const queueName = `driver.${driverId}.notifications`;
const routingKey = `driver.${driverId}`;
const exchange = rabbitmq.exchanges.DRIVER_NOTIFICATIONS;
  try {
    // Assert queue and binding (idempotent)
    await rabbitmq.assertQueue(queueName, {
      durable: true,
      autoDelete: false,
      arguments: {
        'x-message-ttl': 1800000,
        'x-expires': 3600000
      }
    });
    await rabbitmq.bindQueue(queueName, rabbitmq.exchanges.DRIVER_NOTIFICATIONS, `driver.${driverId}`);

    const channel = await rabbitmq.getChannel();

    const notifications = [];
    let msg;

    // Pull all messages (non-blocking)
    do {
      msg = await channel.get(queueName, { noAck: false });
      if (msg) {
        const content = JSON.parse(msg.content.toString());
        
        // Save notification in Redis list (as JSON string)
        // Key format: driver:{driverId}:notifications
        await redisClient.lpush(`driver:${driverId}:notifications`, JSON.stringify(content));

        // Set expiry for this key if not already set
        await redisClient.expire(`driver:${driverId}:notifications`, 1800); // 30 minutes in seconds

        

        notifications.push(content);
        // channel.ack(msg);
      }
    } while (msg);

    // Fetch all notifications from Redis for driver to return (optional)
    const redisNotificationsRaw = await redisClient.lrange(`driver:${driverId}:notifications`, 0, -1);
    const redisNotifications = redisNotificationsRaw.map(str => JSON.parse(str));

    res.json({ success: true, notifications: redisNotifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
  }
});

router.post('/:driverId/accept', async (req, res) => {
  const { driverId } = req.params;
  const { orderId } = req.body;

  try {
    const redisKey = `driver:${driverId}:notifications`;

    // Get all notifications for driver
    const notificationsRaw = await redisClient.lrange(redisKey, 0, -1);

    // Find the index of notification with this orderId
    const index = notificationsRaw.findIndex(str => {
      const notif = JSON.parse(str);
      return notif.orderId === orderId;
    });

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Notification not found or expired' });
    }

    // Remove notification from Redis list by index
    // Redis doesn't have direct remove by index, so workaround:
    // 1. Use LSET to set the element at index to a unique placeholder
    // 2. LREM to remove the placeholder
    const placeholder = '__DELETED__';

    await redisClient.lset(redisKey, index, placeholder);
    await redisClient.lrem(redisKey, 1, placeholder);

    // Now, mark order as accepted in your DB (example)
    const order = await Order.findById(orderId);
    console.log('order inside accept', order)
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (order.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Order cannot be accepted' });
    }

    order.status = 'accepted';
    order.driver = driverId;
    await order.save();


    // Prepare event message
    const eventMessage = {
      orderId: order._id.toString(),
      driverId,
      status: 'accepted',
      timestamp: new Date().toISOString(),
    };
    console.log('inside accept, eventmessasge', eventMessage)

    // Publish to Kafka
    await producer.connect()
    
    await producer.send({
      topic: 'order_accepted',
      messages: [{ value: JSON.stringify(eventMessage) }],
    });

    // Publish to RabbitMQ
    await rabbitmq.publish(
      rabbitmq.exchanges.ORDER_EVENTS,  // or your specific exchange for order updates
      'order.accepted',                 // routing key (example)
      eventMessage,
      { persistent: true }
    );


    res.json({ success: true, message: 'Order accepted, event published' });

  } catch (error) {
    console.error('Error accepting order:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});


module.exports = router;
