const Database = require("../src/database")

require('dotenv').config();

async function syncDatabase() {
  const base = new Database({
    database: process.env.DB_NAME || 'bitrix_admin',
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306
  });
  await base.connect()
  await base.sync()
}

syncDatabase();