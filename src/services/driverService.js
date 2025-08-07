const rabbitmq = require('../config/rabbitmq')
const User  = require('../models/User')
const Order = require('../models/Order')

async function findDriver(orderId) {
    const order = await Order.findById(orderId).populate('user')
    if(!order || order.status !== 'pending') return []

    const coords = order?.user?.location?.coordinates
    if(!Array.isArray(coords) || !coords || coords.length !== 2) {
        console.error('invalid coordinates')
        return []
    }

    console.log('finddriver', coords)
    const drivers = await User.find({
        role: 'driver',
        // status: 'available',
        location: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [coords[0] - 0.1 , coords[1] - 0.1]
                },
                $maxDistance: 50000
            }
        }
    }).limit(10)
    console.log('finddriver drivers', drivers)
    
    
    return drivers
}

async function notifyDrivers(orderId, drivers) {
    const order = await Order.findById(orderId);
    if (!order) return;

    const exchange = rabbitmq.exchanges.DRIVER_NOTIFICATIONS;

  await Promise.all(drivers.map(async (driver) => {
    const driverQueue = `driver.${driver._id}.notifications`;
    const routingKey = `driver.${driver._id}`;

    // Assert queue with same options as consumer expects
    await rabbitmq.assertQueue(driverQueue, {
      durable: true,
      autoDelete: false,
      arguments: {
        'x-message-ttl': 1800000,   // 30 min TTL per message
        'x-expires': 3600000       // Queue expires after 1 hour inactivity
      }
    });

    // Bind queue to the exchange with routing key
    await rabbitmq.bindQueue(driverQueue, exchange, routingKey);

    // Publish the notification message to the exchange with routing key
    await rabbitmq.publish(exchange, routingKey, {
      orderId,
      restaurant: order.restaurant,
    //   pickupLocation: order.location,
      deliveryLocation: order.user.location,
      expiresAt: new Date(Date.now() + 1800000)
    });
  }));
}

module.exports = { findDriver, notifyDrivers };