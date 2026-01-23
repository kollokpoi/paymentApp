const express = require('express')
const router = express.Router()
const { subscriptionController } = require('../controllers')
const { authenticateToken } = require('../middleware/auth')

router.get('/', authenticateToken, subscriptionController.get)
router.post('/update', authenticateToken, subscriptionController.updateMetadata)
router.post('/checkavalible', authenticateToken, subscriptionController.updateLimits)

module.exports = router
