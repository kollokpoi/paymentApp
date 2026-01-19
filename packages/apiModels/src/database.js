const { Sequelize, Op } = require('sequelize');
const initModels = require('./models');

class Database {
  constructor(config = {}) {
    this.sequelize = null;
    this.models = null;
    this.config = {
      database: config.database || process.env.DB_NAME || 'bitrix_admin',
      username: config.username || process.env.DB_USER || 'root',
      password: config.password || process.env.DB_PASSWORD || '',
      host: config.host || process.env.DB_HOST || 'localhost',
      port: config.port || process.env.DB_PORT || 3306,
      dialect: config.dialect || 'mysql',
      logging: config.logging !== undefined ? config.logging : 
               (process.env.NODE_ENV === 'development' ? console.log : false),
      pool: {
        max: config.pool?.max || 10,
        min: config.pool?.min || 0,
        acquire: config.pool?.acquire || 30000,
        idle: config.pool?.idle || 10000,
        ...config.pool
      },
      define: {
        underscored: true,
        timestamps: true,
        paranoid: config.paranoid || false,
        ...config.define
      }
    };
  }

  /**
   * Подключение к базе данных
   */
  async connect() {
    try {
      this.sequelize = new Sequelize(
        this.config.database,
        this.config.username,
        this.config.password,
        {
          host: this.config.host,
          port: this.config.port,
          dialect: this.config.dialect,
          logging: this.config.logging,
          pool: this.config.pool,
          define: this.config.define,
          dialectOptions: this.config.dialectOptions
        }
      );
      this.sequelize.Op = Op;
      // Инициализируем модели
      this.models = initModels(this.sequelize);

      // Тестируем соединение
      await this.sequelize.authenticate();
      
      console.log('Database connected successfully');
      return this;
    } catch (error) {
      console.error('Unable to connect to the database:', error);
      throw error;
    }
  }

  /**
   * Синхронизация моделей с базой данных
   * @param {Object} options - Опции синхронизации
   */
  async sync(options = {}) {
    if (!this.sequelize) {
      throw new Error('Database not connected. Call connect() first.');
    }

    const syncOptions = {
      force: false,
      alter: process.env.NODE_ENV === 'development',
      ...options
    };

    return this.sequelize.sync(syncOptions);
  }

  /**
   * Закрытие соединения
   */
  async close() {
    if (this.sequelize) {
      await this.sequelize.close();
      console.log('Database connection closed');
    }
  }

  /**
   * Начать транзакцию
   */
  async transaction(callback) {
    return this.sequelize.transaction(callback);
  }

  /**
   * Получить модель по имени
   */
  getModel(name) {
    if (!this.models) {
      throw new Error('Models not initialized. Call connect() first.');
    }
    
    const model = this.models[name];
    if (!model) {
      throw new Error(`Model "${name}" not found`);
    }
    
    return model;
  }

  /**
   * Проверить статус подключения
   */
  async checkHealth() {
    try {
      await this.sequelize.authenticate();
      return { status: 'healthy', message: 'Database connection OK' };
    } catch (error) {
      return { status: 'unhealthy', message: error.message };
    }
  }

  /**
   * Получить статистику по соединениям
   */
  getStats() {
    if (!this.sequelize) {
      return null;
    }

    const pool = this.sequelize.connectionManager.pool;
    return {
      total: pool.size,
      idle: pool.available,
      waiting: pool.waiting,
      using: pool.size - pool.available
    };
  }
}

module.exports = Database;