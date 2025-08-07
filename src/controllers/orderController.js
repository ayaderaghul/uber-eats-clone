const {producer} = require('../config/kafka')
const {KAFKA_TOPICS} = require('../config/constants')
const Order = require('../models/Order')
const Restaurant = require('../models/Restaurant')
const User = require('../models/User')

const CacheService = require('../services/cacheService')

const OrderEvents = {
    CREATED: 'order-created',
    UPDATED: 'order-updated',
    STATUS_CHANGED: 'order-status-changed',
    DRIVER_ASSIGNED: 'driver-assigned',
    COMPLETED: 'order-completed'
}

const publishOrderEvent = async(eventType, order, metadata = {} ) => {
    await producer.connect()
    await producer.send({
        topic: KAFKA_TOPICS.ORDERS,
        messages: [{
            key: eventType,
            value: JSON.stringify({
                eventType,
                orderId: order._id,
                userId: order.user,
                restaurantId: order.restaurant,
                driverId: order.driver,
                status: order.status,
                timestamp: new Date(),
                ...metadata
            })
        }]
    })
}

exports.createOrder = async(req,res) =>{
    try {
        const {restaurantId, items,location,paymentMethod} = req.body


        const restaurant = await Restaurant.findById(restaurantId)
        if(!restaurant) {
            return res.status(404).json({message: 'restaurant not found'})
        }

        const orderData= {
            user: req.user.id,
            restaurant: restaurantId,
            items,
            location,
            payment:{
                method: paymentMethod,
                amount: this.total,
                status: 'pending'
            },
            status: 'pending'

        }
        const order = await Order.create(orderData)
        
        await CacheService.getOrSetAutoHotness(
            `order:${order._id}`,
            1800, // default 30 min
            () => console.log('this function do nothing in create order')
        )


        await publishOrderEvent(OrderEvents.CREATED, order)

        assignDriverToOrder(order._id).catch(console.error)

        res.status(201).json(order)

    }catch(err){
        res.status(500).json({message: err.message})
    }
}

async function assignDriverToOrder(orderId){
    const order = await Order.findById(orderId).populate('user')
    if(!order || order.status !== 'pending') return 
    const coords = order?.user?.location?.coordinates;

    if (!coords || coords.length !== 2) {
      console.error("Missing or invalid user coordinates");
      return;
    }
    const driver = await User.findOne({
        status: 'available',
        'location' : {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: order.user?.location?.coordinates
                },
                $maxDistance: 5000 // 5km radius
            }
        }
    })

    if(driver) {
        order.driver = driver._id
        order.status = 'accepted'
        await order.save()
        await CacheService.getOrSetAutoHotness(
            `order:${order._id}`,
            1800, // default 30 min
            // TODO CAREFUL WITH AWAIT HERE
            () => console.log('this function also do nothing')
        )
        await Promise.all([
            publishOrderEvent(OrderEvents.DRIVER_ASSIGNED, order, { driverId: driver._id }),
            publishOrderEvent(OrderEvents.STATUS_CHANGED, order)
            ]);

            // Notify driver (via WebSocket or push notification)
            // notifyDriver(driver._id, order._id);


        
    }
}


exports.getOrderById = async (req, res) => {
  try {
    const order = await CacheService.getOrSetAutoHotness(
      `order:${req.params.id}`,
      1800, // 30 min cache
      () => Order.findById(req.params.id).populate('restaurant driver')
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Authorization - only user, restaurant owner, or driver can view
    const isAuthorized = [order.user, order.restaurant?.owner, order.driver?._id]
      .some(id => id && id.toString() === req.user.id);

    if (!isAuthorized && !req.user.roles.includes('admin')) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    // const order = await Order.findById(req.params.id);

    const order = await CacheService.getOrSetAutoHotness(
            `order:${order._id}`,
            1800, // default 30 min
            () => Order.findById(req.params.id)
        )

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Authorization
    if (order.driver?.toString() !== req.user.id && 
        !req.user.roles.includes('admin')) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Validate status transition
    if (!isValidStatusTransition(order.status, status)) {
      return res.status(400).json({ message: 'Invalid status transition' });
    }

    order.status = status;
    
    // Set completion time if delivered
    if (status === 'delivered') {
      order.actualDeliveryTime = new Date();
    }

    await order.save();

    // Update cache
    // await CacheService.set(`order:${order._id}`, order, 3600);
    // await order.save()
        

    // Publish Kafka event
    await publishOrderEvent(OrderEvents.STATUS_CHANGED, order);

    // If completed, send to analytics
    if (status === 'delivered') {
      await publishOrderEvent(OrderEvents.COMPLETED, order);
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    const { status, limit = 10, page = 1 } = req.query;
    const cacheKey = `user-orders:${req.user.id}:${status || 'all'}:${page}`;

    const orders = await CacheService.getOrSetAutoHotness(
      cacheKey,
      900, // 15 min cache
      () => Order.find({ user: req.user.id, ...(status && { status }) })
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .populate('restaurant')
    );

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getRestaurantOrders = async (req, res) => {
  try {
    const { status, limit = 10, page = 1 } = req.query;
    const cacheKey = `restaurant-orders:${req.params.restaurantId}:${status || 'all'}:${page}`;

    // Verify restaurant ownership
    const restaurant = await Restaurant.findById(req.params.restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    if (restaurant.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const orders = await CacheService.getOrSetAutoHotness(
      cacheKey,
      300, // 5 min cache (orders change frequently)
      () => Order.find({ restaurant: req.params.restaurantId, ...(status && { status }) })
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .populate('user driver')
    );

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateDriverLocation = async (req, res) => {
  try {
    const { latitude, longitude, orderId } = req.body;
    
    // Update driver location
    await Driver.findByIdAndUpdate(req.user.id, {
      currentLocation: {
        type: 'Point',
        coordinates: [longitude, latitude]
      }
    });

    // If associated with an active order, publish update
    if (orderId) {
      const order = await Order.findOne({
        _id: orderId,
        driver: req.user.id,
        status: { $in: ['accepted', 'picked_up'] }
      });

      if (order) {
        await publishOrderEvent('driver-location-updated', order, {
          coordinates: [longitude, latitude]
        });
      }
    }

    res.json({ message: 'Location updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Helper function to validate status transitions
function isValidStatusTransition(currentStatus, newStatus) {
  const validTransitions = {
    pending: ['accepted', 'cancelled'],
    accepted: ['preparing', 'cancelled'],
    preparing: ['ready', 'cancelled'],
    ready: ['picked_up'],
    picked_up: ['delivered'],
    cancelled: [],
    delivered: []
  };

  return validTransitions[currentStatus]?.includes(newStatus);
}


