const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const CacheService = require("../services/cacheService");

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
        type: String,
        enum: ['admin', 'customer', 'restaurant', 'driver'],
        default: 'customer'
    },
    status: {
        type: String,
        enum: ['available', 'notavailable']
    },
   location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
      },
      coordinates: {
        type: [Number] // [longitude, latitude]
        // index: "2dsphere"
      }
  },

    
}, { timestamps: true });  // Fixed typo here

// Define geospatial index separately (better performance)
userSchema.index({ location: "2dsphere" });

// Password hashing middleware
userSchema.pre('save', async function(next) {
    if(!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Password comparison method
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Cache busting middleware
userSchema.post(["save", "findOneAndUpdate", "deleteOne"], async function(doc) {
    const userId = doc?._id || this.getQuery()?._id;
    if (userId) {
        await CacheService.del(`user:${userId}`);
    }
});

module.exports = mongoose.model('User', userSchema);