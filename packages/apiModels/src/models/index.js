const Portal = require('./Portal');
const Application = require('./Application');
const Tariff = require('./Tariff');
const Subscription = require('./Subscription');
const Payment = require('./Payment');
const AdminUser = require('./AdminUser');

function initModels(sequelize) {
  const models = {
    Portal: Portal(sequelize),
    Application: Application(sequelize),
    Tariff: Tariff(sequelize),
    Subscription: Subscription(sequelize),
    Payment: Payment(sequelize),
    AdminUser: AdminUser(sequelize)
  };

  // Определяем связи
  models.Application.hasMany(models.Tariff, {
    foreignKey: 'app_id',
    as: 'tariffs',
    onDelete: 'CASCADE'
  });
  models.Tariff.belongsTo(models.Application, {
    foreignKey: 'app_id',
    as: 'application'
  });

  models.Portal.hasMany(models.Subscription, {
    foreignKey: 'portal_id',
    as: 'subscriptions',
    onDelete: 'CASCADE'
  });
  models.Subscription.belongsTo(models.Portal, {
    foreignKey: 'portal_id',
    as: 'portal'
  });

  models.Application.hasMany(models.Subscription, {
    foreignKey: 'app_id',
    as: 'subscriptions',
    onDelete: 'CASCADE'
  });
  models.Subscription.belongsTo(models.Application, {
    foreignKey: 'app_id',
    as: 'application'
  });

  models.Tariff.hasMany(models.Subscription, {
    foreignKey: 'tariff_id',
    as: 'subscriptions',
    onDelete: 'CASCADE'
  });
  models.Subscription.belongsTo(models.Tariff, {
    foreignKey: 'tariff_id',
    as: 'tariff'
  });

  models.Subscription.hasMany(models.Payment, {
    foreignKey: 'subscription_id',
    as: 'payments',
    onDelete: 'CASCADE'
  });
  models.Payment.belongsTo(models.Subscription, {
    foreignKey: 'subscription_id',
    as: 'subscription'
  });

  return models;
}

module.exports = initModels;