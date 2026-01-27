const { SubscriptionDTO, TariffDTO } = require('@payment-app/apiModels')
const ObjectUtils = require('../utils/ObjectUtils')
const axios = require('axios');

class SubsciptionController {
  get(req, res, next) {
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

  async updateMetadata(req, res, next) {
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

  async updateLimits(req, res, next) {
    if (!req.subscription) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const { key, action } = req.body;
    if (!key || typeof key !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Valid key is required'
      });
    }

    const subscription = req.subscription;
    let usedLimits = JSON.parse(JSON.stringify(
      subscription.used_limits || {}
    ));

    if (!usedLimits || typeof usedLimits !== 'object') {
      usedLimits = {};
    }

    if (!subscription.isActive()) {
      return res.status(401).json({
        success: false,
        message: 'Subscription expired or not found'
      })
    }

    const tariff = await subscription.getTariff();
    if (!tariff) {
      return res.status(500).json({
        success: false,
        message: 'Failed to load tariff'
      });
    }

    const tariffDTO = TariffDTO.fromSequelize(tariff);

    if (!tariffDTO.limits || !ObjectUtils.has(tariffDTO.limits, key)) {
      return res.status(200).json({
        success: true,
        message: 'action available',
        data: {
          available: true,
          reason: 'no_limit',
          hasLimit: false
        }
      });
    }

    if (!ObjectUtils.has(usedLimits, key)) {
      ObjectUtils.set(usedLimits, key, 0);
    }

    // 7. Получение значений
    const limit = ObjectUtils.get(tariffDTO.limits, key);
    let used = ObjectUtils.get(usedLimits, key, 0);

    if (!limit) {
      return res.status(200).json({
        success: true,
        message: 'action available',
        data: {
          available: true,
          reason: 'no_limit',
          hasLimit: false
        }
      });
    }

    let isAvailable = true;
    let newUsed = used;
    let operation = null;

    switch (action) {
      case 'minus':
      case 'decrement':
        if (used > 0) {
          newUsed = used - 1;
          operation = 'decremented';
        } else {
          isAvailable = false;
          operation = 'cannot_decrement';
        }
        break;

      case 'plus':
      case 'increment':
      default:
        if (used < limit) {
          newUsed = used + 1;
          operation = 'incremented';
        } else {
          isAvailable = false;
          operation = 'limit_exceeded';
        }
        break;
    }

    // 10. Если действие невозможно - возвращаем ответ
    if (!isAvailable) {
      return res.status(200).json({
        success: true,
        message: `Action not available (${operation})`,
        data: {
          available: false,
          reason: operation,
          used,
          limit,
          remaining: Math.max(0, limit - used)
        }
      });
    }

    ObjectUtils.set(usedLimits, key, newUsed);

    try {
      const result = await subscription.update({
        used_limits: usedLimits,
      });
    } catch (error) {
      console.error('Failed to update limits:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to save changes'
      });
    }

    return res.status(200).json({
      success: true,
      message: `Action ${operation} successfully`,
      data: {
        available: true,
        action: operation,
        previousUsed: used,
        newUsed,
        limit,
        remaining: limit - newUsed
      }
    });
  }

  async updateToken(req, res, next) {
    if (!req.subscription) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    const { access_token, refresh_token } = req.body;

    if (!access_token || typeof access_token !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'access_token is required'
      });
    }

    if (!refresh_token || typeof refresh_token !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'refresh_token is required'
      });
    }

    const metadata = {
      ...req.subscription.metadata, // копируем все старые поля
      lastTokenUpdate: new Date().toISOString(),
      tokenExpiresAt: new Date(Date.now() + 55 * 60 * 1000).toISOString()
    };

    try {
      await req.subscription.update({
        b24_access_token: access_token,
        b24_refresh_token: refresh_token,
        metadata
      })
      res.json({
        success: true
      })
    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const Subscription = req.db.getModel('Subscription')
      const dataRows = await Subscription.findAll({
        where: {
          user_type: {
            [req.db.sequelize.Op.or]: ['user', 'owner']
          }
        },
        include: [
          {
            model: req.db.getModel("Tariff"),
            as: 'tariff',
            required: true
          },
          {
            model: req.db.getModel("Portal"),
            as: 'portal',
            required: true
          }
        ]
      });
      const subscriptions = dataRows.map((sub) =>
        SubscriptionDTO.fromSequelize(sub).toApiResponse()
      );
      res.json({
        success: true,
        data: subscriptions,
      });
    } catch (error) {
      next(error);
    }
  }

  async getToken(req, res, next) {
    const { id } = req.params

    try {
      const Subscription = req.db.getModel('Subscription');
      const subscription = await Subscription.findByPk(id);

      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: 'Subscription not found'
        });
      }

      const { b24_access_token, b24_refresh_token, metadata } = subscription;

      if (!b24_refresh_token || !b24_access_token) {
        return res.status(400).json({
          success: false,
          message: 'Tokens do not exist'
        });
      }

      const now = new Date();
      const tokenExpiresAt = metadata?.tokenExpiresAt
        ? new Date(metadata.tokenExpiresAt)
        : null;

      if (tokenExpiresAt && tokenExpiresAt > now) {
        return res.json({
          success: true,
          data: {
            access_token: b24_access_token,
            tokenExpiresAt: tokenExpiresAt.toISOString()
          }
        });
      }

      const newTokens = await refreshBitrixToken(b24_refresh_token, subscription);

      const updatedMetadata = {
        ...subscription.metadata,
        lastTokenUpdate: new Date().toISOString(),
        tokenExpiresAt: new Date(Date.now() + 55 * 60 * 1000).toISOString()
      };

      await subscription.update({
        b24_access_token: newTokens.access_token,
        b24_refresh_token: newTokens.refresh_token,
        metadata: updatedMetadata
      });

      res.json({
        success: true,
        data: {
          access_token: newTokens.access_token,
          tokenExpiresAt: updatedMetadata.tokenExpiresAt,
          message: 'Token refreshed'
        }
      });

    } catch (error) {
      next(error);
    }
  }

  async updateMetadataById(req, res, next) {
    const { id } = req.params;
    const Subscription = req.db.getModel('Subscription')
    const subscription = await Subscription.findByPk(id);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'subscription not found'
      });
    }

    const { updates } = req.body

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

async function refreshBitrixToken(refreshToken, subscription) {
  try {
    const url = 'https://oauth.bitrix.info/oauth/token/';

    const application = await subscription.getApplication();

    const client_id = application.client_id;
    const client_secret = application.client_secret;

    if (!client_id || !client_secret) {
      throw new Error('BITRIX_CLIENT_ID or BITRIX_CLIENT_SECRET not configured');
    }

    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: client_id,
      client_secret: client_secret,
      refresh_token: refreshToken
    });

    const response = await axios.post(url, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 10000
    });

    const data = response.data;

    if (!data.access_token) {
      throw new Error(`Failed to refresh token: ${JSON.stringify(data)}`);
    }

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in || 3600
    };

  } catch (error) {
    console.error('Error refreshing Bitrix token:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw new Error(`Token refresh failed: ${error.message}`);
  }
}

module.exports = new SubsciptionController()
