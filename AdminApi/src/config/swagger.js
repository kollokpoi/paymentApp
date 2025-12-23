const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Bitrix Admin API',
      version: '1.0.0',
      description: 'API для управления приложениями и тарифами Bitrix24',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001/api',
        description: 'Development server'
      },
      {
        url: 'http://188.17.155.59:3001/api',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Portal: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            b24MemberId: { type: 'string' },
            b24Domain: { type: 'string' },
            companyName: { type: 'string' },
            adminEmail: { type: 'string', format: 'email' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Application: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            code: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            version: { type: 'string' },
            isActive: { type: 'boolean' },
            iconUrl: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Tariff: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            appId: { type: 'string', format: 'uuid' },
            code: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number', format: 'float' },
            period: { type: 'string', enum: ['day', 'week', 'month', 'year'] },
            trialDays: { type: 'integer' },
            isActive: { type: 'boolean' },
            isDefault: { type: 'boolean' },
            limits: { type: 'object' },
            features: { 
              type: 'array',
              items: { type: 'string' }
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Subscription: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            portalId: { type: 'string', format: 'uuid' },
            appId: { type: 'string', format: 'uuid' },
            tariffId: { type: 'string', format: 'uuid' },
            status: { 
              type: 'string', 
              enum: ['trial', 'active', 'suspended', 'cancelled', 'expired'] 
            },
            validFrom: { type: 'string', format: 'date-time' },
            validUntil: { type: 'string', format: 'date-time' },
            autoRenew: { type: 'boolean' },
            trialEndDate: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Payment: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            subscriptionId: { type: 'string', format: 'uuid' },
            externalId: { type: 'string' },
            amount: { type: 'number', format: 'float' },
            currency: { type: 'string' },
            status: { 
              type: 'string', 
              enum: ['pending', 'completed', 'failed', 'refunded'] 
            },
            paymentMethod: { type: 'string' },
            description: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        AdminUser: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            role: { 
              type: 'string', 
              enum: ['superadmin', 'admin', 'support'] 
            },
            isActive: { type: 'boolean' },
            lastLogin: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
            message: { type: 'string' },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                limit: { type: 'integer' },
                total: { type: 'integer' },
                pages: { type: 'integer' }
              }
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', default: false },
            message: { type: 'string' },
            error: { type: 'string' },
            stack: { type: 'string' }
          }
        }
      }
    },
    tags: [
      {
        name: 'Portals',
        description: 'Операции с порталами Bitrix24'
      },
      {
        name: 'Applications',
        description: 'Управление приложениями'
      },
      {
        name: 'Tariffs',
        description: 'Управление тарифными планами'
      },
      {
        name: 'Subscriptions',
        description: 'Управление подписками'
      },
      {
        name: 'Payments',
        description: 'Управление платежами'
      },
      {
        name: 'Auth',
        description: 'Аутентификация администраторов'
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js'
  ]
};

const specs = swaggerJsdoc(options);

module.exports = specs;