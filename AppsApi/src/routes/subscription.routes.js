const express = require('express')
const router = express.Router()
const { subscriptionController } = require('../controllers')
const { authenticateToken, authorize } = require('../middleware/auth')

router.get('/', authenticateToken, subscriptionController.get)
router.get('/getAll',authenticateToken,authorize('bot','owner'), subscriptionController.getAll)
router.get('/:id/getToken',authenticateToken,authorize('bot','owner'), subscriptionController.getToken)
router.post('/update', authenticateToken, subscriptionController.updateMetadata)
router.post('/checkavalible', authenticateToken, subscriptionController.updateLimits)
router.post('/updatetoken', authenticateToken, subscriptionController.updateToken)
router.post('/:id/update',authenticateToken,authorize('bot','owner'), subscriptionController.updateMetadataById)

module.exports = router
