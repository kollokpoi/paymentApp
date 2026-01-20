const express = require('express')
const router = express.Router()
const {authController} = require('../controllers')
const {authenticateToken} = require('../middleware/auth')

router.use('/authenticateToken',authenticateToken,(req,res)=>{
    return res.status(200).json(req.subscription)
})
router.post('/login',authController.login)
router.post('/register',authController.register)
router.post('/refresh', authController.refresh)

module.exports = router
