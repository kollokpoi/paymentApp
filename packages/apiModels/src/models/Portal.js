const { DataTypes } = require('sequelize')
module.exports = sequelize => {
  const Portal = sequelize.define(
    'Portal',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        comment: 'Уникальный идентификатор портала'
      },
      b24_domain: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'Domain cannot be empty'
          },
        },
        comment: 'Домен Bitrix24 (company.bitrix24.ru)'
      },
      company_name: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: '',
        comment: 'Название компании'
      },
      admin_email: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
          isEmail: {
            msg: 'Please provide a valid email address'
          }
        },
        comment: 'Email администратора портала'
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Активен ли портал'
      },
      metadata: {
        type: DataTypes.JSON,
        defaultValue: {},
        get() {
          const rawValue = this.getDataValue('metadata')
          try {
            return rawValue ? JSON.parse(rawValue) : {}
          } catch {
            return rawValue || {}
          }
        },
        set(value) {
          this.setDataValue(
            'metadata',
            typeof value === 'string' ? value : JSON.stringify(value || {})
          )
        },
        comment: 'Дополнительные метаданные в JSON формате'
      },
      last_sync_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Время последней синхронизации с Bitrix24'
      },
      balance: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0
        },
        defaultValue:0,
        comment: 'Баланс портала'
      },
    },
    {
      tableName: 'portals',
      timestamps: true,
      paranoid: false,
      indexes: [
        {
          fields: ['b24_domain']
        },
        {
          fields: ['is_active']
        },
        {
          fields: ['created_at']
        }
      ],
      hooks: {
        beforeCreate: portal => {
          // Автоматически генерируем company_name из domain если не указан
          if (!portal.company_name && portal.b24_domain) {
            portal.company_name = portal.b24_domain.split('.')[0]
          }
        },
        beforeUpdate: portal => {

        }
      },
      scopes: {
        active: {
          where: { is_active: true }
        },
        withSubscriptions: {
          include: ['subscriptions']
        },
        search(query) {
          return {
            where: {
              [sequelize.Op.or]: [
                { b24_domain: { [sequelize.Op.like]: `%${query}%` } },
                { company_name: { [sequelize.Op.like]: `%${query}%` } },
                { admin_email: { [sequelize.Op.like]: `%${query}%` } }
              ]
            }
          }
        }
      }
    }
  )

  Portal.prototype.toJSON = function () {
    const values = Object.assign({}, this.get())

    return values
  }

  Portal.prototype.getCleanDomain = function () {
    return this.b24_domain
      .replace('.bitrix24.ru', '')
      .replace('.bitrix24.com', '')
  }

  Portal.findByDomain = function (domain, options = {}) {
    return this.findOne({
      where: { b24_domain: domain },
      ...options
    })
  }

  return Portal
}
