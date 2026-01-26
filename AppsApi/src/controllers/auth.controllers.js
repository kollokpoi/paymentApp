const jwt = require('jsonwebtoken')
const { SubscriptionDTO } = require('@payment-app/apiModels')

class AuthController {
  async login (req, res, next) {
    try {
      const { domain, applicationId } = req.body

      if (!domain || !applicationId) {
        return res.status(400).json({
          success: false,
          message: 'domain and applicationId are required'
        })
      }

      const Portal = req.db.getModel('Portal')
      const portal = await Portal.findByDomain(domain)
      if (!portal || !portal.is_active) {
        return res.status(401).json({
          success: false,
          message: 'Portal not found or not active'
        })
      }

      const Subscription = req.db.getModel('Subscription')
      const subscription = await Subscription.findOne({
        where: {
          portal_id: portal.id,
          app_id: applicationId
        },
        include: ['tariff']
      })

      if (!subscription) {
        return res.status(401).json({
          success: false,
          message: 'Subscription expired or not found'
        })
      }

      return generateAuthResponse(subscription, res)
    } catch (error) {
      next(error)
    }
  }

  async refresh (req, res, next) {
    try {
      const { refreshToken } = req.body

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required'
        })
      }

      let decoded
      try {
        decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)
      } catch (error) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired refresh token'
        })
      }

      const Subscription = req.db.getModel('Subscription')

      const subscription = await Subscription.findOne({
        where: {
          id: decoded.subId
        },
        include: ['tariff']
      })

      if (!subscription) {
        return res.status(401).json({
          success: false,
          message: 'Subscription not found'
        })
      }

      if (!subscription.isActive()) {
        return res.status(401).json({
          success: false,
          message: 'Subscription is not active'
        })
      }

      return generateAuthResponse(subscription, res)
    } catch (error) {
      next(error)
    }
  }

  async register (req, res, next) {
    try {
      const {
        domain,
        applicationId,
        companyName = null,
        adminEmail = null,
        portalData = {}
      } = req.body

      if (!domain || !applicationId) {
        return res.status(400).json({
          success: false,
          message: 'Domain and applicationId are required'
        })
      }

      const db = req.db
      const Portal = db.getModel('Portal')
      const Subscription = db.getModel('Subscription')
      const Tariff = db.getModel('Tariff')
      const Application = db.getModel('Application')

      const application = await Application.findByPk(applicationId)
      if (!application) {
        return res.status(400).json({
          success: false,
          message: 'Application not found'
        })
      }

      let portal = await Portal.findByDomain(domain)

      if (portal) {
        if (!portal.is_active) {
          await portal.update({ is_active: true })
        }
      } else {
        portal = await Portal.create({
          b24_domain: domain,
          company_name: companyName || domain.split('.')[0],
          admin_email: adminEmail || null,
          is_active: true,
          metadata: {
            ...portalData,
            registered_at: new Date().toISOString(),
            registration_source: 'auto_register',
            initial_app_id: applicationId
          }
        })
      }

      let subscription = await Subscription.findOne({
        where: {
          portal_id: portal.id,
          app_id: applicationId,
          status: ['trial', 'active']
        },
        include: ['tariff']
      })

      if (subscription && subscription.isActive()) {
        return generateAuthResponse(subscription, res)
      }

      let tariff = await Tariff.scope('default').findOne({
        where: { app_id: applicationId }
      })

      if (!tariff) {
        tariff = await Tariff.scope('active').findOne({
          where: { app_id: applicationId },
          order: [
            ['sort_order', 'ASC'],
            ['createdAt', 'ASC']
          ]
        })

        if (!tariff) {
          return res.status(400).json({
            success: false,
            message: 'No tariffs available for this application'
          })
        }
      }

      const now = new Date()
      let trialEndDate = null
      let status = 'active'

      if (tariff.trial_days > 0) {
        status = 'trial'
        trialEndDate = new Date(now)
        trialEndDate.setDate(trialEndDate.getDate() + tariff.trial_days)
      }

      const periodDays = tariff.getPeriodInDays ? tariff.getPeriodInDays() : 30
      const validUntil = new Date(now)
      validUntil.setDate(validUntil.getDate() + periodDays)

      subscription = await Subscription.create({
        portal_id: portal.id,
        app_id: applicationId,
        tariff_id: tariff.id,
        status: status,
        valid_from: now,
        valid_until: validUntil,
        trial_end_date: trialEndDate,
        auto_renew: true,
        metadata: {
          created_via: 'auto_register',
          tariff_code: tariff.code,
          trial_days: tariff.trial_days,
          initial_tariff: tariff.name
        }
      })

      const subscriptionWithTariff = await Subscription.findByPk(
        subscription.id,
        {
          include: ['tariff']
        }
      )
      return generateAuthResponse(subscriptionWithTariff, res)
    } catch (error) {
      console.error('Registration error:', error)

      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
          success: false,
          message: 'Portal with this domain already exists'
        })
      }

      next(error)
    }
  }
}

function generateAuthResponse (subscription, res) {
  try {
    const accessToken = jwt.sign(
      {
        appId: subscription.app_id,
        subId: subscription.id,
        portalId: subscription.portal_id
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRES || '1h' }
    )

    const refreshToken = jwt.sign(
      { subId: subscription.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES || '200d' }
    )

    const subscriptionDTO = SubscriptionDTO.fromSequelize(subscription)

    res.json({
      success: true,
      data: {
        subscription: subscriptionDTO.toApiResponse(),
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 3600 * 5
        }
      }
    })
  } catch (error) {
    throw error
  }
}
module.exports = new AuthController()
