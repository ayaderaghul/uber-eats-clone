const mongoose = require("mongoose");
const CacheSerivce = require('../services/cacheService')

const menuItemSchema = new mongoose.Schema({
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant",
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true
  },
  imageUrl: {
    type: String
  },
  category: {
    type: String // e.g., "Main", "Drink", "Dessert"
  },
  available: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});


menuItemSchema.post(["save", "findOneAndUpdate", "deleteOne"], async function (doc) {
  const restaurantId = doc?.restaurant || this.getQuery()?.restaurant;
  if (restaurantId) {
    await CacheService.del(`menu:${restaurantId}`);
  }
});

module.exports = mongoose.model("MenuItem", menuItemSchema);
