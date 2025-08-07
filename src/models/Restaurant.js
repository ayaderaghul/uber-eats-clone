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
  location: {
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
  
  imageUrl: {
    type: String
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
