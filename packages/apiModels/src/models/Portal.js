const { DataTypes } = require('sequelize');
const { validateEmail, validateDomain } = require('../utils/validators');

module.exports = (sequelize) => {
  const Portal = sequelize.define('Portal', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      comment: 'Уникальный идентификатор портала'
    },
    b24_member_id: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: {
          msg: 'Member ID cannot be empty'
        },
        len: {
          args: [3, 100],
          msg: 'Member ID must be between 3 and 100 characters'
        }
      },
      comment: 'Bitrix24 Member ID (уникальный идентификатор портала в B24)'
    },
    b24_domain: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Domain cannot be empty'
        },
        isBitrixDomain(value) {
          if (!validateDomain(value)) {
            throw new Error('Invalid Bitrix24 domain format');
          }
        }
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
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Активен ли портал'
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {},
      get() {
        const rawValue = this.getDataValue('metadata');
        try {
          return rawValue ? JSON.parse(rawValue) : {};
        } catch {
          return rawValue || {};
        }
      },
      set(value) {
        this.setDataValue('metadata', 
          typeof value === 'string' ? value : JSON.stringify(value || {})
        );
      },
      comment: 'Дополнительные метаданные в JSON формате'
    },
    last_sync_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Время последней синхронизации с Bitrix24'
    }
  }, {
    tableName: 'portals',
    timestamps: true,
    paranoid: false,
    indexes: [
      {
        unique: true,
        fields: ['b24_member_id']
      },
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
      beforeCreate: (portal) => {
        // Автоматически генерируем company_name из domain если не указан
        if (!portal.company_name && portal.b24_domain) {
          portal.company_name = portal.b24_domain.split('.')[0];
        }
      },
      beforeUpdate: (portal) => {
        // Обновляем время последней синхронизации при обновлении токенов
        if (portal.changed('b24_access_token') || portal.changed('b24_refresh_token')) {
          portal.last_sync_at = new Date();
        }
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
        };
      }
    }
  });

  // Методы экземпляра
  Portal.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    
    // Убираем чувствительные данные
    delete values.b24_access_token;
    delete values.b24_refresh_token;
    
    return values;
  };

  Portal.prototype.isTokenExpired = function() {
    if (!this.last_sync_at) return true;
    
    const now = new Date();
    const lastSync = new Date(this.last_sync_at);
    const hoursDiff = (now - lastSync) / (1000 * 60 * 60);
    
    // Токены Bitrix24 обычно живут 1 час
    return hoursDiff > 0.9; // 54 минуты
  };

  Portal.prototype.getCleanDomain = function() {
    return this.b24_domain.replace('.bitrix24.ru', '').replace('.bitrix24.com', '');
  };

  // Статические методы
  Portal.findByMemberId = function(memberId, options = {}) {
    return this.findOne({
      where: { b24_member_id: memberId },
      ...options
    });
  };

  Portal.findByDomain = function(domain, options = {}) {
    return this.findOne({
      where: { b24_domain: domain },
      ...options
    });
  };

  return Portal;
};