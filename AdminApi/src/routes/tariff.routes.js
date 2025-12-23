const express = require('express');
const router = express.Router();
const tariffController = require('../controllers/tariff.controller');
const { authenticateToken, authorize } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Tariffs
 *   description: Управление тарифными планами
 */

/**
 * @swagger
 * /tariffs:
 *   get:
 *     summary: Получить все тарифы
 *     tags: [Tariffs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: appId
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Список тарифов
 */
router.get('/', authenticateToken, authorize('admin', 'superadmin', 'support'), tariffController.getAll);

/**
 * @swagger
 * /tariffs:
 *   post:
 *     summary: Создать новый тариф
 *     tags: [Tariffs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - appId
 *               - code
 *               - name
 *               - price
 *             properties:
 *               appId:
 *                 type: string
 *               code:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *                 format: float
 *               period:
 *                 type: string
 *                 enum: [day, week, month, year]
 *               trialDays:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *               isDefault:
 *                 type: boolean
 *               limits:
 *                 type: object
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *               sortOrder:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Тариф создан
 */
router.post('/', authenticateToken, authorize('superadmin', 'admin'), tariffController.create);

/**
 * @swagger
 * /tariffs/{id}:
 *   get:
 *     summary: Получить тариф по ID
 *     tags: [Tariffs]
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
 *         description: Данные тарифа
 */
router.get('/:id', authenticateToken, authorize('admin', 'superadmin', 'support'), tariffController.getById);

/**
 * @swagger
 * /tariffs/{id}:
 *   put:
 *     summary: Обновить тариф
 *     tags: [Tariffs]
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *                 format: float
 *               period:
 *                 type: string
 *                 enum: [day, week, month, year]
 *               trialDays:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *               isDefault:
 *                 type: boolean
 *               limits:
 *                 type: object
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *               sortOrder:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Тариф обновлен
 */
router.put('/:id', authenticateToken, authorize('superadmin', 'admin'), tariffController.update);

/**
 * @swagger
 * /tariffs/{id}:
 *   delete:
 *     summary: Удалить тариф
 *     tags: [Tariffs]
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
 *         description: Тариф удален
 */
router.delete('/:id', authenticateToken, authorize('superadmin'), tariffController.delete);

module.exports = router;