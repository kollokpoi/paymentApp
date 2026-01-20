const { SubscriptionDTO } = require('@payment-app/apiModels')

class SubsciptionController {
  get (req, res, next) {
    if (!req.subscription) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      })
    }

    res.json({
      success: true,
      data: req.subscription
    })
  }

  async updateMetadata (req, res, next) {
    const { updates } = req.body
    if (!req.subscription) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      })
    }
    
    const subscription = req.subscription
    const currentMetadata = subscription.metadata || {}
    const newMetadata = {
      ...currentMetadata,
      ...updates
    }
    await subscription.update({
      metadata: newMetadata
    })

    return res.json({
      success: true,
      data: SubscriptionDTO.fromSequelize(subscription).toApiResponse()
    })
  }
}

module.exports = new SubsciptionController()
