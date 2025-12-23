const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const portalRoutes = require('./portal.routes');
const applicationRoutes = require('./application.routes');
const tariffRoutes = require('./tariff.routes');
const subscriptionRoutes = require('./subscription.routes');
const paymentRoutes = require('./payment.routes');

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Основные маршруты
router.use('/auth', authRoutes);
router.use('/portals', portalRoutes);
router.use('/applications', applicationRoutes);
router.use('/tariffs', tariffRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/payments', paymentRoutes);

module.exports = router;