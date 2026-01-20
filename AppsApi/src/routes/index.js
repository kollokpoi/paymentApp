const express = require('express');
const router = express.Router();
const authRoutes = require('./auth.routes')
const tariffRoutes = require('./tariff.routes')
const applicationRoutes = require('./application.routes')
const portalRoutes = require('./portal.routes')
const subscriptionRoutes = require('./subscription.routes')

router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

router.use('/auth',authRoutes)
router.use('/tariffs',tariffRoutes)
router.use('/application',applicationRoutes)
router.use('/portal',portalRoutes)
router.use('/subscription',subscriptionRoutes)

module.exports = router;