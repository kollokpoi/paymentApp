const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticateToken } = require('../middleware/auth');


/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Аутентификация администраторов
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Вход в систему
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Успешный вход
 *       401:
 *         description: Неверные учетные данные
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Получить информацию о текущем пользователе
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Данные пользователя
 */
router.get('/me',authenticateToken, authController.getMe);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Обновить токен
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Токен обновлен
 */
router.post('/refresh', authController.refreshToken);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Выход из системы
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Успешный выход
 */
router.post('/logout', authController.logout);

module.exports = router;