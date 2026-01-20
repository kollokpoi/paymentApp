const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('bitrixApps', 'paymentAppUser', 'Ilovework123_', {
  host: 'localhost',
  port: 3306,
  dialect: 'mysql'
});

async function test() {
  try {
    await sequelize.authenticate();
    console.log('✅ Подключение к БД успешно!');
  } catch (error) {
    console.error('❌ Ошибка подключения:', error);
  } finally {
    await sequelize.close();
  }
}

test();