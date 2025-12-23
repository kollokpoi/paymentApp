const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Application = sequelize.define('Application', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [2, 50],
        is: /^[a-z][a-z0-9_]*$/i
      },
      comment: 'Код приложения (используется в API)'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100]
      },
      comment: 'Название приложения'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Описание приложения'
    },
    version: {
      type: DataTypes.STRING(20),
      defaultValue: '1.0.0',
      comment: 'Версия приложения'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Активно ли приложение'
    },
    icon_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'URL иконки приложения'
    },
    settings: {
      type: DataTypes.JSON,
      defaultValue: {},
      comment: 'Настройки приложения'
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Порядок сортировки'
    }
  }, {
    tableName: 'applications',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['code'] },
      { fields: ['is_active'] },
      { fields: ['sort_order'] }
    ],
    scopes: {
      active: {
        where: { is_active: true }
      },
      withTariffs: {
        include: ['tariffs']
      }
    }
  });

  return Application;
};