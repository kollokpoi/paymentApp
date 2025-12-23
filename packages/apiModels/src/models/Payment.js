const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Payment = sequelize.define('Payment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    subscription_id: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'ID подписки'
    },
    external_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Внешний ID платежа (из платежной системы)'
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      },
      comment: 'Сумма платежа'
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'RUB',
      validate: {
        len: [3, 3],
        isUppercase: true
      },
      comment: 'Валюта платежа'
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
      defaultValue: 'pending',
      comment: 'Статус платежа'
    },
    payment_method: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Метод оплаты'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Описание платежа'
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {},
      comment: 'Метаданные платежа'
    }
  }, {
    tableName: 'payments',
    timestamps: true,
    indexes: [
      { fields: ['subscription_id'] },
      { fields: ['external_id'] },
      { fields: ['status'] },
      { fields: ['created_at'] }
    ],
    hooks: {
      afterUpdate: async (payment) => {
        // Если платеж стал успешным, обновляем подписку
        if (payment.changed('status') && payment.status === 'completed') {
          const subscription = await payment.getSubscription();
          if (subscription) {
            await subscription.update({
              status: 'active'
            });
          }
        }
      }
    }
  });

  return Payment;
};