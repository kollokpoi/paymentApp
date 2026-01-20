const express = require('express');
const router = express.Router();
const {applicationController} = require('../controllers')

router.get('/:id',applicationController.get)
router.get('/:appId/tariffs', applicationController.getTariffs)

module.exports = router;