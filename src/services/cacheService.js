const redis = require('../config/redis')

class CacheService{
    static async getOrSetAutoHotness(key,defaultTtlSeconds,fetchFunction, threshold=50) {
        try {

            const hitKey = `hits:${key}`
            const hits = await redis.incr(hitKey)

            if (hits===1){
                await redis.expire(hitKey,300) // track hitkey for 5 min window
            }


            const cachedData = await redis.get(key)

            if(cachedData) {
                console.log(`cache hit for ${key}`)
                return JSON.parse(cachedData)
            }

            console.log(`cache miss for ${key}`)

            const freshData = await fetchFunction()

            let ttl = defaultTtlSeconds
            if (hits >= threshold) {
                ttl = defaultTtl * 3 // triple ttl
                console.log(`${key} marked HOT (TTL: ${ttl}s)`)

            }else {
                console.log(`${key} remains COLD (TTL: ${ttl}s)`)
            }

            await redis.setex(key,ttl, JSON.stringify(freshData))
            return freshData
        }catch(err){
            console.log('redis error', err)
            return fetchFunction()
        }
    }

    static async del(key) {
        try {
            await redis.del(key)
            console.log(`cache deleted: ${key}`)
        }catch(err){
            console.error('redis delete error', err)
        }
    }

    static async delByPrefix(prefix) {
        try {
            const keys = await redis.keys(`${prefix}:*`)
            if(keys.length){
                await redis.del(keys)
                console.log(`cache deleted for prefix: ${prefix}`)
            }
        }catch(err){
            console.error('redis deletedByPrefix error', err)
        }
    }

    static async getCacheStats() {
        const keys = await redis.keys('*')
        const stats = []

        for (const key of keys) {
            const ttl = await redis.ttl(key)
            const hits = await redis.get(`hits:${key}`)
            stats.push({
                key,
                ttl: ttl > 0 ? `${ttl}s` : ' no expiry',
                hits: hits || 0,
                status: hits >= 50 ? 'HOT' : 'COLD'
            })
        }
        return stats
    }
}

module.exports = CacheService