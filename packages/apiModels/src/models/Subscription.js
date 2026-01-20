const { DataTypes, Op } = require('sequelize')

module.exports = sequelize => {
  const Subscription = sequelize.define(
    'Subscription',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      portal_id: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'ID портала'
      },
      app_id: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'ID приложения'
      },
      b24_access_token: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Access token для Bitrix24 REST API'
      },
      b24_refresh_token: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Refresh token для Bitrix24 REST API'
      },
      tariff_id: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'ID тарифа'
      },
      status: {
        type: DataTypes.ENUM(
          'trial',
          'active',
          'suspended',
          'cancelled',
          'expired'
        ),
        defaultValue: 'trial',
        comment: 'Статус подписки'
      },
      valid_from: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: 'Дата начала подписки'
      },
      valid_until: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: 'Дата окончания подписки'
      },
      auto_renew: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Автоматическое продление'
      },
      trial_end_date: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Дата окончания триального периода'
      },
      metadata: {
        type: DataTypes.JSON,
        defaultValue: {},
        comment: 'Метаданные подписки'
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Заметки по подписке'
      }
    },
    {
      tableName: 'subscriptions',
      timestamps: true,
      indexes: [
        { fields: ['portal_id'] },
        { fields: ['app_id'] },
        { fields: ['tariff_id'] },
        { fields: ['status'] },
        { fields: ['valid_until'] },
        {
          unique: true,
          fields: ['portal_id', 'app_id'],
          where: { status: ['trial', 'active'] }
        }
      ],
      hooks: {
        beforeCreate: async subscription => {
          if (subscription.status === 'trial' && !subscription.trial_end_date) {
            subscription.trial_end_date = new Date()
            subscription.trial_end_date.setDate(
              subscription.trial_end_date.getDate() + 14
            )
          }

          if (!subscription.valid_until) {
            subscription.valid_until = new Date()
            subscription.valid_until.setDate(
              subscription.valid_until.getDate() + 30
            )
          }
        }
      },
      scopes: {
        active: {
          where: {
            status: ['trial', 'active'],
            valid_until: { [Op.gt]: new Date() }
          }
        },
        expired: {
          where: {
            valid_until: { [Op.lt]: new Date() }
          }
        },
        forPortal (portalId) {
          return {
            where: { portal_id: portalId }
          }
        },
        forApp (appId) {
          return {
            where: { app_id: appId }
          }
        }
      }
    }
  )

  Subscription.prototype.isActive = function () {
    return (
      ['trial', 'active'].includes(this.status) &&
      new Date(this.valid_until) > new Date()
    )
  }

  Subscription.prototype.isTrial = function () {
    return (
      this.status === 'trial' &&
      (!this.trial_end_date || new Date(this.trial_end_date) > new Date())
    )
  }

  Subscription.prototype.daysLeft = function () {
    const now = new Date()
    const until = new Date(this.valid_until)
    const diff = until - now
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  Subscription.prototype.trialDaysLeft = function () {
    if (!this.isTrial() || !this.trial_end_date) return 0

    const now = new Date()
    const trialEnd = new Date(this.trial_end_date)
    const diff = trialEnd - now
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  return Subscription
}
