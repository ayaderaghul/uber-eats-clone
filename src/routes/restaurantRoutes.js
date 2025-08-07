const express = require('express')

const {
    createRestaurant,
    updateRestaurant,
    deleteRestaurant,
    getAllRestaurants,
        getAllRestaurantsWithoutRedis,
    getRestaurantById,
    getMenuByRestaurant,
    getNearbyRestaurants
} = require('../controllers/restaurantController')

const {protect} = require('../middlewares/authMiddleware')

const router = express.Router()

router.post('/', protect, createRestaurant)

router.put('/:id', protect, updateRestaurant)
router.delete('/:id', protect, deleteRestaurant)

router.get('/', getAllRestaurants)
router.get('/without-redis', getAllRestaurantsWithoutRedis)

router.get('/nearby', getNearbyRestaurants) // ?lat=..&lng=..&radius=..

router.get('/:id', getRestaurantById)

router.get('/:id/menu', getMenuByRestaurant)

module.exports = router