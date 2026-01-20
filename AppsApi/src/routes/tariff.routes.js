const express = require('express')
const router = express.Router()
const { tariffController } = require('../controllers')
const { authenticateToken } = require('../middleware/auth')

router.get('/',authenticateToken,tariffController.getCurrent)



module.exports = router