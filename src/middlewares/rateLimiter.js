const redis = require('../config/redis')

exports.rateLimitRefresh = async(req,res,next) =>{
    try {
        const refreshToken = req.cookies.refreshToken
        if(!refreshToken) return res.status(400).json({message: 'no refresh token'})

        let userId
        try{
            const decoded = require('jsonwebtoken').decode(refreshToken)
            userId = decoded?.id
        }catch{
            return res.status(400).json({message: 'invalid token format'})
        }

        if(!userId) return res.status(400).json({message: 'invalid refresh token'})

        const key = `ratelimit:refresh:${userId}`
        // sliding window rate limiter
        const attempts = await redis.incr(key)

        if (attempts === 1) {
            await redis.expire(key,60) // reset count after 60 sec
        }

        if (attempts > 5) {
            return res.status(429).json({message: 'too many requests'})
        }

        next()
    }catch(err){
        res.status(500).json({message: 'rate limit check failed'})
    }
}