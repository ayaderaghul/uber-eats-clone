const mongoose = require('mongoose');
const { Schema } = mongoose;

const orderItemSchema = new Schema({
  menuItem: { 
    type: Schema.Types.ObjectId, 
    ref: 'MenuItem',
    required: true 
  },
  quantity: { 
    type: Number, 
    required: true,
    min: 1 
  },
  price: { 
    type: Number, 
    required: true 
  },
  specialInstructions: String
}, { _id: false });

const orderSchema = new Schema({
  user: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  restaurant: { 
    type: Schema.Types.ObjectId, 
    ref: 'Restaurant',
    required: true 
  },
  
  items: [orderItemSchema],
  
  status: {
    type: String,
    enum: [
      'pending', 
      'accepted', 
      'preparing', 
      'ready', 
      'picked_up', 
      'delivered', 
      'cancelled'
    ],
    default: 'pending'
  },
  payment: {
    method: {
      type: String,
      enum: ['credit_card', 'cash', 'mobile_payment'],
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    amount: { type: Number }
  },
  estimatedDeliveryTime: Date,
  actualDeliveryTime: Date,
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  feedback: String
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true } 
});

// Indexes for faster queries
orderSchema.index({ status: 1 });
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ restaurant: 1, createdAt: -1 });
orderSchema.index({ driver: 1, createdAt: -1 });

// Virtual for order total
orderSchema.virtual('total').get(function() {
  return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
});

orderSchema.set('toObject', { virtuals: true });
orderSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Order', orderSchema);