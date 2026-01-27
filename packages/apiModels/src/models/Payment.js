const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Payment = sequelize.define('Payment', {
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
      { fields: ['portal_id'] },
      { fields: ['external_id'] },
      { fields: ['status'] },
      { fields: ['created_at'] }
    ],
  });

  return Payment;
};