const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const config = require('./config/swagger');
const routes = require('./routes');
const logger = require('./utils/logger');
const { Database } = require('@payment-app/apiModels')
const SubscriptionAutoCheck = require('./services/subscriptionChecker')

require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;
// =========== ИСПРАВЛЕННЫЙ CORS ===========
app.use(cors({
  origin: true, // Разрешаем все origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.options('*', cors());
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https:"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      fontSrc: ["'self'", "https:", "data:"],
      connectSrc: ["'self'", "http:", "https:", "ws:", "wss:"]
    }
  },
  crossOriginOpenerPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use((req, res, next) => {
  if (req.path.startsWith('/api-docs')) {
    const removeHeaders = () => {
      res.removeHeader('Cross-Origin-Opener-Policy');
      res.removeHeader('Cross-Origin-Embedder-Policy');
      res.removeHeader('Content-Security-Policy');
    };

    // Удаляем заголовки после установки
    const originalSetHeader = res.setHeader;
    res.setHeader = function (name, value) {
      if (name.toLowerCase() === 'cross-origin-opener-policy' ||
        name.toLowerCase() === 'cross-origin-embedder-policy') {
        return this;
      }
      return originalSetHeader.call(this, name, value);
    };

    removeHeaders();
  }
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Bitrix Admin API'
  });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(config));

let db;
let subscriptionAutoCheck = null;

app.use(async (req, res, next) => {
  try {
    if (!db) {
      db = new Database({
        database: process.env.DB_NAME,
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT
      });
      await db.connect();
      console.log('database connected');
    }
    if (!subscriptionAutoCheck && db.sequelize) {
      subscriptionAutoCheck = new SubscriptionAutoCheck(db.sequelize.models);

      setTimeout(() => {
        try {
          subscriptionAutoCheck.start();
          console.log('Автоматическая проверка подписок запущена');

          global.subscriptionAutoCheck = subscriptionAutoCheck;

        } catch (error) {
          console.error('Не удалось запустить авто-проверку:', error);
        }
      }, 3000);

      console.log('⚙️ Сервис авто-проверки подписок инициализирован');
    }
    req.db = db;
    next();
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ error: 'Database connection failed' });
  }
});


app.use('/api', routes);

app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path
  });
});

app.use((err, req, res, next) => {
  logger.error('Global error handler:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  const status = err.status || 500;
  const response = {
    success: false,
    message: err.message || 'Internal server error'
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.error = err.toString();
  }

  res.status(status).json(response);
});

app.listen(port, () => {
  console.log(`Запущен на порту ${port}`)
})