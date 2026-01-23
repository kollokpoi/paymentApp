const { SubscriptionDTO, TariffDTO } = require('@payment-app/apiModels')
const ObjectUtils = require('../utils/ObjectUtils')

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
        used_limits: usedLimits
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
}


module.exports = new SubsciptionController()
