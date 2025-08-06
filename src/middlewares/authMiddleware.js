const jwt = require('jsonwebtoken')
const redis = require('../config/redis')

exports.protect = async(req,res,next) =>{
    try {
        let token
        if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1]
        }
        if(!token) return res.status(401).json({message: 'no token, authorization denied'})

        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        req.user = decoded
        next()

    }catch(err) {
        res.status(401).json({message: 'not authorized'})
    }
}

exports.authorize = (...roles) => {
    return (req, res, next) => {
        if(!req.user) {
            return res.status(401).json({message: 'not authenticated'})
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `User with ${req.user.role} role is not authorized here`
            })
        }
        next()
    }
}