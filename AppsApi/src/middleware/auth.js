const jwt = require('jsonwebtoken')
const {SubscriptionDTO} = require('@payment-app/apiModels')

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      })
    }

    const Subsciption = req.db.getModel('Subscription')
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const sub = await Subsciption.findByPk(decoded.subId)

    if (!sub) {
      return res.status(401).json({
        success: false,
        message: 'Sub not found or inactive'
      })
    }

    req.subscription = sub
    next()
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token'
    })
  }
}

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      })
    }

    next()
  }
}

module.exports = { authenticateToken, authorize }
