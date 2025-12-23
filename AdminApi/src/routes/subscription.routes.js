const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscription.controller');
const { authenticateToken, authorize } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Subscriptions
 *   description: Управление подписками
 */

/**
 * @swagger
 * /subscriptions:
 *   get:
 *     summary: Получить все подписки
 *     tags: [Subscriptions]
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
 *         name: portalId
 *         schema:
 *           type: string
 *       - in: query
 *         name: appId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [trial, active, suspended, cancelled, expired]
 *     responses:
 *       200:
 *         description: Список подписок
 */
router.get('/', authenticateToken, authorize('admin', 'superadmin', 'support'), subscriptionController.getAll);

/**
 * @swagger
 * /subscriptions:
 *   post:
 *     summary: Создать новую подписку
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - portalId
 *               - appId
 *               - tariffId
 *             properties:
 *               portalId:
 *                 type: string
 *               appId:
 *                 type: string
 *               tariffId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [trial, active, suspended, cancelled, expired]
 *               validFrom:
 *                 type: string
 *                 format: date-time
 *               validUntil:
 *                 type: string
 *                 format: date-time
 *               autoRenew:
 *                 type: boolean
 *               trialEndDate:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Подписка создана
 */
router.post('/', authenticateToken, authorize('superadmin', 'admin'), subscriptionController.create);

/**
 * @swagger
 * /subscriptions/{id}:
 *   get:
 *     summary: Получить подписку по ID
 *     tags: [Subscriptions]
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
 *         description: Данные подписки
 */
router.get('/:id', authenticateToken, authorize('admin', 'superadmin', 'support'), subscriptionController.getById);

/**
 * @swagger
 * /subscriptions/{id}:
 *   put:
 *     summary: Обновить подписку
 *     tags: [Subscriptions]
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
 *                 enum: [trial, active, suspended, cancelled, expired]
 *               validUntil:
 *                 type: string
 *                 format: date-time
 *               autoRenew:
 *                 type: boolean
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Подписка обновлена
 */
router.put('/:id', authenticateToken, authorize('superadmin', 'admin'), subscriptionController.update);

/**
 * @swagger
 * /subscriptions/{id}/renew:
 *   post:
 *     summary: Продлить подписку
 *     tags: [Subscriptions]
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
 *               days:
 *                 type: integer
 *                 description: Количество дней для продления
 *     responses:
 *       200:
 *         description: Подписка продлена
 */
router.post('/:id/renew', authenticateToken, authorize('superadmin', 'admin', 'support'), subscriptionController.renew);

/**
 * @swagger
 * /subscriptions/{id}/change-tariff:
 *   post:
 *     summary: Сменить тариф подписки
 *     tags: [Subscriptions]
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
 *             required:
 *               - tariffId
 *             properties:
 *               tariffId:
 *                 type: string
 *               immediate:
 *                 type: boolean
 *                 description: Применить немедленно
 *     responses:
 *       200:
 *         description: Тариф изменен
 */
router.post('/:id/change-tariff', authenticateToken, authorize('superadmin', 'admin'), subscriptionController.changeTariff);

module.exports = router;