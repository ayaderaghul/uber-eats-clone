const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const {protect, authorize} = require('../middlewares/authMiddleware');

// Apply authentication middleware to all order routes
router.use(protect);

// Order creation
router.post('/', 
  orderController.createOrder
);

// Order retrieval
router.get('/:id', orderController.getOrderById);

// Order status updates (driver or admin only)
router.patch('/:id/status',
  authorize('driver', 'admin'),
  orderController.updateOrderStatus
);

// User's order history
router.get('/user/history', 
  orderController.getUserOrders
);

// Restaurant order management (restaurant owner only)
router.get('/restaurant/:restaurantId',
  authorize('restaurant'),
  orderController.getRestaurantOrders
);

// Driver location updates (driver only)
router.post('/:id/location',
  authorize('driver'),
  orderController.updateDriverLocation
);

// Optional webhook for payment confirmation
// router.post('/:id/payment-webhook',
//   orderController.handlePaymentWebhook
// );

module.exports = router;