const express = require('express')

const {register,login,logout, refreshToken, getUser} = require('../controllers/authController')
const {protect} = require('../middlewares/authMiddleware')
const {rateLimitRefresh} = require('../middlewares/rateLimiter')
const router = express.Router()

router.post('/register', register)
router.post('/login', login)
router.post('/refresh', rateLimitRefresh, refreshToken)
router.post('/logout', logout)

router.get('/:id', getUser)

module.exports = router