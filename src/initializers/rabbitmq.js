const rabbitmq = require('../config/rabbitmq');
const { findDriver, notifyDrivers } = require('../services/driverService');
const Order = require('../models/Order');

async function initializeOrderConsumers() {
  // Consumer for new orders
  await rabbitmq.consume(rabbitmq.queues.ORDER_CREATED, async (message) => {
    const { orderId } = message;
    try {
      const drivers = await findDriver(orderId);
      console.log('intializer, finddriver', drivers)
      if (drivers.length > 0) {
        await notifyDrivers(orderId, drivers);
      } else {
        setTimeout(() => {
          rabbitmq.publish(
            rabbitmq.exchanges.ORDER_EVENTS,
            '',
            { orderId, retryCount: (message.retryCount || 0) + 1 }
          );
        }, 5000);
      }
    } catch (error) {
      console.error('Order processing error:', error);
    }
  });

  // Consumer for driver responses
  await rabbitmq.consume(rabbitmq.queues.DRIVER_RESPONSES, async (message) => {
    const { orderId, driverId, accepted } = message;
    if (!accepted) return;

    try {
      const updated = await Order.findOneAndUpdate(
        { _id: orderId, status: 'pending' },
        { $set: { driver: driverId, status: 'accepted' } },
        { new: true }
      );
      
      if (updated) {
        // ... handle successful assignment ...
      }
    } catch (error) {
      console.error('Driver response error:', error);
    }
  });
}

module.exports = async function initializeRabbitMQ() {
  try {
    await rabbitmq.connect(); // Ensure connection is established
    await initializeOrderConsumers();
    console.log('✅ RabbitMQ consumers initialized');
  } catch (error) {
    console.error('❌ Failed to initialize RabbitMQ:', error);
    process.exit(1); // Exit if critical initialization fails
  }
};