const Restaurant = require('../models/Restaurant')
const MenuItem = require('../models/MenuItem')
const redis = require('../config/redis')
const CacheService = require('../services/cacheService')
exports.createRestaurant = async(req,res) =>{
    try{
        const data = { ...req.body, owner: req.user.id}
        const restaurant = await Restaurant.create(data)
        res.status(201).json(restaurant)
    }catch(err){
        res.status(500).json({message: err.message})
    }
}

exports.updateRestaurant = async(req,res) =>{
    try {
        const restaurant = await Restaurant.findById(req.params.id)
        if (!restaurant) return res.status(404).json({message: 'not found'})

        if(restaurant.owner.toString() !== req.user.id) {
            return res.status(403).json({message: 'forbidden'})
        }

        Object.assign(restaurant, req.body)
        await restaurant.save()

        // await redis.del(`restaurant:${req.params.id}`)
        // await redis.del(`restaurants:all`)

        await CacheService.del(`restaurant:${req.params.id}`)
        await CacheService.del('restaurants:all')

        res.json(restaurant)
    }catch(err){
        res.status(500).json({message: err.message})
    }
}

exports.deleteRestaurant = async(req,res) =>{
    try{
        const restaurant = await Restaurant.findById(req.params.id)

        if (!restaurant) return res.status(404).json({message: 'not found'})
        if(restaurant.owner.toString() !== req.user.id) {
            return res.status(403).json({message: 'forbidden'})
        }

        await restaurant.deleteOne()
        res.json({message: 'deleted successfully'})
    }catch(err){
        res.status(500).json({message: err.message})
    }
}

exports.getAllRestaurants = async(req,res) =>{
    try{
        const restaurants = await CacheService.getOrSetAutoHotness(
            'restaurants: all',
            1800, // default 30 min
            () => Restaurant.find()
        )
        res.json(restaurants)
    }catch(err){
        res.status(500).json({message: err.message})
    }
}

exports.getRestaurantById = async(req,res) =>{
    try{
        // const restaurant = await Restaurant.findById(req.params.id)
        // if(!restaurant) return res.status(404).json({message: 'not found'})
        
        // await redis.setex(res.locals.cacheKey, 3600, JSON.stringify(restaurant))
        
        const restaurant = await CacheService.getOrSetAutoHotness(
            `restaurant:${req.params.id}`,
            3600, // 1h
            () => Restaurant.findById(req.params.id)
        )

        res.json(restaurant)
    }catch(err){
        res.status(500).json({message: err.message})
    }
}

exports.getMenuByRestaurant = async(req,res) =>{
    try{
        const menu = await MenuItem.find({restaurant: req.params.id,available:true})
        res.json(menu)
    } catch(err){
        res.status(500).json({message: err.message})
    }
}

exports.getNearbyRestaurants = async(req,res) =>{
    const {lat,lng,radius=5} = req.query
    if (!lat || !lng) {
        return res.status(400).json({message: 'lat and lng required'})
    }

    try {
        const restaurants = await Restaurant.find({
            'address.coordinates': {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(lng), parseFloat(lat)]
                    },
                    $maxDistance: radius * 1000 // meters
                }
            }
        })
        res.json(restaurants)
    }catch(err){
        res.status(500).json({message: err.message})
    }
}