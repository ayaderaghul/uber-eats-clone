const mongoose=require('mongoose')
const Restaurant=require('../src/models/Restaurant')
require('dotenv').config()

mongoose.connect(process.env.MONGO_URI)
    .then(async() => {
        console.log('connected to mongodb')
        await Restaurant.collection.createIndex({'address.coordinates': '2dsphere'})
        console.log('2dsphere index created')
        process.exit()
    })
    .catch(err => console.error(err))