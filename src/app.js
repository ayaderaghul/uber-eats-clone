const express= require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const dotenv=require('dotenv')
const connectDB=require('./config/db')
dotenv.config()
connectDB()

const app=express()
app.use(cors({
    origin: 'http://localhost:3000', //frontend
    credentials: true // allow cookies
}))
app.use(cookieParser())
app.use(express.json())

app.use('/api/auth', require('./routes/authRoutes'))
app.use('/api/restaurants', require('./routes/restaurantRoutes.js'))
app.use('/api/menu-items', require('./routes/menuItemRoutes.js'))
app.use('/admin', require('./routes/adminRoutes.js'))
app.use('/api/orders', require('./routes/orderRoutes.js'))

app.get('/',(req,res) =>{
    res.send('uber eats api running..')
})

module.exports = app