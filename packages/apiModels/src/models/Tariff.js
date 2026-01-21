const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Tariff = sequelize.define('Tariff', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    app_id: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'ID приложения'
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 50]
      },
      comment: 'Код тарифа'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100]
      },
      comment: 'Название тарифа'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Описание тарифа'
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      },
      comment: 'Цена тарифа'
    },
    period: {
      type: DataTypes.ENUM('day', 'week', 'month', 'year'),
      defaultValue: 'month',
      comment: 'Период оплаты'
    },
    trial_days: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 365
      },
      comment: 'Дней триального периода'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Активен ли тариф'
    },
    is_default: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Тариф по умолчанию для приложения'
    },
    limits: {
      type: DataTypes.JSON,
      defaultValue: {},
      get() {
        const rawValue = this.getDataValue('limits');
        try {
          return rawValue ? JSON.parse(rawValue) : {};
        } catch {
          return rawValue || {};
        }
      },
      set(value) {
        this.setDataValue('limits', 
          typeof value === 'string' ? value : JSON.stringify(value || {})
        );
      },
      comment: 'Лимиты тарифа (JSON)'
    },
    features: {
      type: DataTypes.JSON,
      defaultValue: [],
      get() {
        const rawValue = this.getDataValue('features');
        try {
          return rawValue ? JSON.parse(rawValue) : [];
        } catch {
          return rawValue || [];
        }
      },
      set(value) {
        this.setDataValue('features', 
          typeof value === 'string' ? value : JSON.stringify(value || [])
        );
      },
      comment: 'Функции тарифа (JSON массив)'
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Порядок сортировки'
    }
  }, {
    tableName: 'tariffs',
    timestamps: true,
    indexes: [
      { fields: ['app_id'] },
      { fields: ['is_active'] },
      { fields: ['is_default'] },
      { fields: ['code'] },
      { fields: ['sort_order'] }
    ],
    hooks: {
      beforeCreate: async (tariff) => {
        if (tariff.is_default) {
          await sequelize.models.Tariff.update(
            { is_default: false },
            { where: { app_id: tariff.app_id } }
          );
        }
      },
      beforeUpdate: async (tariff) => {
        if (tariff.changed('is_default') && tariff.is_default) {
          await sequelize.models.Tariff.update(
            { is_default: false },
            { 
              where: { 
                app_id: tariff.app_id,
                id: { [sequelize.Op.ne]: tariff.id }
              }
            }
          );
        }
      }
    },
    scopes: {
      active: {
        where: { is_active: true }
      },
      default: {
        where: { is_default: true }
      },
      forApp(appId) {
        return {
          where: { app_id: appId }
        };
      }
    }
  });

  Tariff.prototype.getPeriodInDays = function() {
    switch (this.period) {
      case 'day': return 1;
      case 'week': return 7;
      case 'month': return 30;
      case 'year': return 365;
      default: return 30;
    }
  };

  Tariff.prototype.calculatePricePerDay = function() {
    const periodDays = this.getPeriodInDays();
    return this.price / periodDays;
  };

  return Tariff;
};