const User = require('../models/User')
const CacheService = require('../services/cacheService')
const jwt = require('jsonwebtoken')
const redis = require('../config/redis')

const generateAccessToken = (id, role) => {
    return jwt.sign({id, role}, process.env.JWT_SECRET, {expiresIn: '15min'})
}

const generateRefreshToken = (id) => {
    return jwt.sign({id}, process.env.JWT_REFRESH_SECRET, {expiresIn: '7d'})
}

exports.register = async(req,res) =>{
    try {
        const {name, email, password, role} = req.body
        const exists = await User.findOne({email})
        if (exists) return res.status(400).json({message: 'user exists'})

        const user = await User.create({name, email, password, role})
        const accessToken = generateAccessToken(user._id, user.role)
        const refreshToken = generateRefreshToken(user._id)

        await redis.set(`refresh:${user._id}`,refreshToken,'EX',60*60*24*7) //24h

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true, // false for local dev not using https
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days

        })

        res.status(201).json({
            _id: user._id,
            name: user.name,
            role: user.role,
            accessToken
        })
    }catch(err) {
        res.status(500).json({message: err.message})
    }
}

exports.login=async(req,res) =>{
    try {
        const {email, password} = req.body
        const user = await User.findOne({email})

        if (user && (await user.matchPassword(password))) {
            const accessToken = generateAccessToken(user._id, user.role);
            const refreshToken = generateRefreshToken(user._id);

            await redis.set(`refresh:${user._id}`, refreshToken, "EX", 60 * 60 * 24 * 7);

            res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true, // false for local dev not using https
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days

            })

            res.json({
                _id: user._id,
                name: user.name,
                role: user.role,
                accessToken
            })
        } else {
            res.status(401).json({message: 'invalid credentials'})
        }
    }catch(err) {
        res.status(500).json({message: err.message})
    }
}

exports.refreshToken = async(req,res) =>{
    try {
        const oldRefreshToken = req.cookies.refreshToken 
        if(!oldRefreshToken) return res.status(401).json({message: 'no refresh token'})

        const decoded = jwt.verify(oldRefreshToken, process.env.JWT_REFRESH_SECRET)

        const storedToken = await redis.get(`refresh:${decoded.id}`)
        if (!storedToken) {
            return res.status(403).json({message: 'no active session, please login again'})
        }

        if (storedToken !== oldRefreshToken) {
            await redis.del(`refresh:${decoded.id}`)
            res.clearCookie('refreshToken', {
                httpOnly: true,
                secure: true,
                sameSite: 'strict'
            })
            return res.status(403).json({message: 'suspicious activity. please login again'})
        }

        const newAccessToken = generateAccessToken(decoded.id, decoded.role)
        const newRefreshToken = generateRefreshToken(decoded.id)
        
        await redis.set(`refresh:${decoded._id}`, newRefreshToken, 'EX', 60*60*24*7)

        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
            });

        res.json({accessToken: newAccessToken})
    } catch(err) {
        res.status(403).json({message: 'invalid or expired refresh token'})
    }
}

exports.logout = async(req,res) => {
    try {
        const refreshToken = req.cookies.refreshToken
        if (!refreshToken) return res.status(400).json({message: 'no refresh token'})
        
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)
        await redis.del(`refresh:${decoded.id}`)
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: true,
            sameSite: "strict"
            });
        res.json({message: 'logout successfully'})
    } catch(err) {
        res.status(500).json({message: err.message})
    }
}

exports.getUser = async(req,res) =>{
    // const user = await User.findById(req.params.id).select('-password')
    // await redis.setex(res.locals.cacheKey, 1800, JSON.stringify(user))
    
    const user = await CacheService.getOrSet(
        `usr:${req.params.id}`,
        1800,
        () => User.findById(req.params.id).select('-password')
    )
    
    res.json(user)
}

exports.updateUser = async(req,res) =>{
    const user = await CacheService.getOrSetAutoHotness(
        `user:${req.params.id}`,
        900, // 15min
        () => User.findById(req.params.id).select('-password'),
        20
    )
    res.json(user)
}