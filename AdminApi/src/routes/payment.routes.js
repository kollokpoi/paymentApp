const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { authenticateToken, authorize } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Управление платежами
 */

/**
 * @swagger
 * /payments:
 *   get:
 *     summary: Получить все платежи
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: subscriptionId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, failed, refunded]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Список платежей
 */
router.get('/', authenticateToken, authorize('admin', 'superadmin', 'support'), paymentController.getAll);

/**
 * @swagger
 * /payments/stats:
 *   get:
 *     summary: Получить статистику платежей
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Статистика платежей
 */
router.get('/stats', authenticateToken, authorize('admin', 'superadmin'), paymentController.getStats);

/**
 * @swagger
 * /payments:
 *   post:
 *     summary: Создать новый платеж
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subscriptionId
 *               - amount
 *             properties:
 *               subscriptionId:
 *                 type: string
 *               externalId:
 *                 type: string
 *               amount:
 *                 type: number
 *                 format: float
 *               status:
 *                 type: string
 *                 enum: [pending, completed, failed, refunded]
 *               paymentMethod:
 *                 type: string
 *               description:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Платеж создан
 */
router.post('/', authenticateToken, authorize('superadmin', 'admin'), paymentController.create);

/**
 * @swagger
 * /payments/count:
 *   get:
 *     summary: Получить количество подписок
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Количество подписок
 */
router.get('/count', authenticateToken, paymentController.getActiveCount);

/**
 * @swagger
 * /payments/{id}:
 *   get:
 *     summary: Получить платеж по ID
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Данные платежа
 */
router.get('/:id', authenticateToken, authorize('admin', 'superadmin', 'support'), paymentController.getById);

/**
 * @swagger
 * /payments/{id}:
 *   put:
 *     summary: Обновить платеж
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, completed, failed, refunded]
 *               externalId:
 *                 type: string
 *               description:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Платеж обновлен
 */
router.put('/:id', authenticateToken, authorize('superadmin', 'admin'), paymentController.update);

/**
 * @swagger
 * /payments/count:
 *   get:
 *     summary: Получить количество подписок
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Количество подписок
 */
router.get('/count', authenticateToken, paymentController.getActiveCount);

module.exports = router;