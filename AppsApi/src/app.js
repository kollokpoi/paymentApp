const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const config = require('./config/swagger');
const routes = require('./routes');
const logger = require('./utils/logger');
const { Database } = require('@payment-app/apiModels')

require('dotenv').config();

const app = express();

// =========== ИСПРАВЛЕННЫЙ CORS ===========
const corsOptions = {
  origin: function (origin, callback) {
    // Разрешаем все origins в development
    if (process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      // В production разрешаем только указанные домены
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        process.env.ADMIN_PANEL_URL
      ].filter(Boolean);
      
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

app.options('*', cors(corsOptions));

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
  crossOriginOpenerPolicy: false, // Убираем проблемный заголовок
  crossOriginEmbedderPolicy: false, // Убираем проблемный заголовок
  crossOriginResourcePolicy: { policy: "cross-origin" } // Разрешаем кросс-доменные ресурсы
}));

app.use((req, res, next) => {
  if (req.path.startsWith('/api-docs')) {
    // Временно удаляем все security headers для Swagger
    const removeHeaders = () => {
      res.removeHeader('Cross-Origin-Opener-Policy');
      res.removeHeader('Cross-Origin-Embedder-Policy');
      res.removeHeader('Content-Security-Policy');
    };
    
    // Удаляем заголовки после установки
    const originalSetHeader = res.setHeader;
    res.setHeader = function(name, value) {
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

app.use(async (req, res, next) => {
  try {
    if (!db) {
      db = new Database({
        database: process.env.DB_NAME,
        username: process.env.DB_USER ,
        password: process.env.DB_PASSWORD ,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT
      });
      await db.connect();
      console.log('database connected');
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

  // В development добавляем stack trace
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.error = err.toString();
  }

  res.status(status).json(response);
});

module.exports = app;