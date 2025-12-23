// Экспортируем основные классы
const Database = require('./database');
const initModels = require('./models');

// Экспортируем DTO классы
const PortalDTO = require('./dto/PortalDTO');
const ApplicationDTO = require('./dto/ApplicationDTO');
const TariffDTO = require('./dto/TariffDTO');
const SubscriptionDTO = require('./dto/SubscriptionDTO');
const PaymentDTO = require('./dto/PaymentDTO');
const AdminUserDTO = require('./dto/AdminUserDTO');

// Вспомогательные функции
const validators = require('./utils/validators');

module.exports = {
  // Основные классы
  Database,
  initModels,
  
  // DTO классы
  PortalDTO,
  ApplicationDTO,
  TariffDTO,
  SubscriptionDTO,
  PaymentDTO,
  AdminUserDTO,
  
  // Утилиты
  validators,
  
  // Константы
  SUBSCRIPTION_STATUS: {
    TRIAL: 'trial',
    ACTIVE: 'active',
    SUSPENDED: 'suspended',
    CANCELLED: 'cancelled',
    EXPIRED: 'expired'
  },
  
  PAYMENT_STATUS: {
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed',
    REFUNDED: 'refunded'
  },
  
  USER_ROLES: {
    SUPERADMIN: 'superadmin',
    ADMIN: 'admin',
    SUPPORT: 'support'
  }
};