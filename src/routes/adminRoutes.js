const express  = require('express')
const CacheService = require('../services/cacheService')

const router = express.Router()

router.get('/cache/stats', async(req,res) =>{
    try {
        const stats = await CacheService.getCacheStats()
        res.json({totalKeys: stats.length, stats})

    }catch(err) {
        res.status(500).json({error: 'failed to fetch cache stats'})
    }
})

module.exports = router