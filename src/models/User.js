const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const CacheService = require("../services/cacheService");


const userSchema = new mongoose.Schema({
    name: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    role: {type: String,
        enum: ['admin', 'customer', 'restaurant', 'delivery'],
        default: 'customer'
    },
    phone: {type: String},
    address: {type: String},
    restaurantName: {type: String},
    vehicleDetails: {type: String}
}, {timeStamps: true})

userSchema.pre('save', async function(next) {
    if(!this.isModified('password')) return next()
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
})

userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password)
}
userSchema.post(["save", "findOneAndUpdate", "deleteOne"], async function (doc) {
  const userId = doc?._id || this.getQuery()?._id;
  if (userId) {
    await CacheService.del(`user:${userId}`);
  }
});

module.exports = mongoose.model('User', userSchema)