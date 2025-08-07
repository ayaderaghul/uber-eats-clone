module.exports = {
  // Kafka Topics
  KAFKA_TOPICS: {
    ORDERS: 'orders',
    RESTAURANTS: 'restaurants',
    DRIVERS: 'drivers',
    NOTIFICATIONS: 'notifications',
    ANALYTICS: 'analytics',
    PAYMENTS: 'payments'
  },

  // Order Status Lifecycle
  ORDER_STATUS: {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    PREPARING: 'preparing',
    READY: 'ready',
    PICKED_UP: 'picked_up',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled'
  },

  // Valid Order Status Transitions
  ORDER_STATUS_TRANSITIONS: {
    pending: ['accepted', 'cancelled'],
    accepted: ['preparing', 'cancelled'],
    preparing: ['ready', 'cancelled'],
    ready: ['picked_up'],
    picked_up: ['delivered'],
    cancelled: [],
    delivered: []
  },

  // Driver Status
  DRIVER_STATUS: {
    OFFLINE: 'offline',
    AVAILABLE: 'available',
    IN_DELIVERY: 'in_delivery',
    ON_BREAK: 'on_break'
  },

  // Redis Cache Keys
  REDIS_KEYS: {
    ORDER: (orderId) => `order:${orderId}`,
    USER_ORDERS: (userId, status, page) => `user-orders:${userId}:${status || 'all'}:${page}`,
    RESTAURANT_ORDERS: (restaurantId, status, page) => `restaurant-orders:${restaurantId}:${status || 'all'}:${page}`,
    RESTAURANT: (restaurantId) => `restaurant:${restaurantId}`,
    RESTAURANTS_ALL: 'restaurants:all',
    DRIVER_LOCATION: (driverId) => `driver:location:${driverId}`
  },

  // Cache TTL (in seconds)
  CACHE_TTL: {
    SHORT: 300,       // 5 minutes
    DEFAULT: 1800,    // 30 minutes
    LONG: 86400,      // 24 hours
    ORDER: 3600,      // 1 hour
    RESTAURANT: 7200  // 2 hours
  },

  // Payment Methods
  PAYMENT_METHODS: {
    CREDIT_CARD: 'credit_card',
    CASH: 'cash',
    MOBILE_PAY: 'mobile_pay'
  },

  // Event Types
  EVENT_TYPES: {
    ORDER_CREATED: 'order-created',
    ORDER_UPDATED: 'order-updated',
    ORDER_STATUS_CHANGED: 'order-status-changed',
    DRIVER_ASSIGNED: 'driver-assigned',
    ORDER_COMPLETED: 'order-completed',
    RESTAURANT_CREATED: 'restaurant-created',
    DRIVER_LOCATION_UPDATED: 'driver-location-updated'
  },

  // Distance Constants (in meters)
  DISTANCE: {
    NEARBY_RADIUS: 5000,       // 5km
    DRIVER_SEARCH_RADIUS: 3000 // 3km
  },

  // Pagination Defaults
  PAGINATION: {
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 50
  },

  // Security Constants
  SECURITY: {
    JWT_EXPIRY: '24h',
    PASSWORD_RESET_EXPIRY: 3600000 // 1 hour in ms
  }
};