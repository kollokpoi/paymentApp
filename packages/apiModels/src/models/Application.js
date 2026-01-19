const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Application = sequelize.define('Application', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    client_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: 'Client ID для OAuth2/API аутентификации'
    },
    client_secret: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Client Secret для OAuth2/API аутентификации'
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
      { unique: true, fields: ['client_id'] },
      { fields: ['is_active'] },
      { fields: ['sort_order'] }
    ]
  });

  return Application;
};