const mongoose = require("mongoose");
const CacheService =require('../services/cacheService')


const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String, // e.g., "Italian", "Fast Food", "Japanese"
    required: true
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String },
    zipCode: { type: String },
    coordinates: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        index: "2dsphere"
      }
    }
  },
  phone: {
    type: String
  },
  imageUrl: {
    type: String
  },
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  isOpen: {
    type: Boolean,
    default: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Restaurant owner
    required: true
  }
}, {
  timestamps: true
});


restaurantSchema.post(['save', 'findOneAndUpdate', 'deleteOne'], async function( ) {
  await CacheService.delByPrefix('restaurants')
  await CacheService.delByPrefix('restaurant')
  await CacheService.delByPrefix('menu')
})

module.exports = mongoose.model("Restaurant", restaurantSchema);
