const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/application.controller');
const { authenticateToken, authorize } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Applications
 *   description: Управление приложениями
 */

/**
 * @swagger
 * /applications:
 *   get:
 *     summary: Получить все приложения
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список приложений
 */
router.get('/', authenticateToken, authorize('admin', 'superadmin', 'support'), applicationController.getAll);

/**
 * @swagger
 * /applications:
 *   post:
 *     summary: Создать новое приложение
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - name
 *             properties:
 *               code:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               version:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               iconUrl:
 *                 type: string
 *               settings:
 *                 type: object
 *     responses:
 *       201:
 *         description: Приложение создано
 */
router.post('/', authenticateToken, authorize('superadmin', 'admin'), applicationController.create);

/**
 * @swagger
 * /applications/{id}:
 *   get:
 *     summary: Получить приложение по ID
 *     tags: [Applications]
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
 *         description: Данные приложения
 */
router.get('/:id', authenticateToken, authorize('admin', 'superadmin', 'support'), applicationController.getById);

/**
 * @swagger
 * /applications/{id}:
 *   put:
 *     summary: Обновить приложение
 *     tags: [Applications]
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
 *               version:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               iconUrl:
 *                 type: string
 *               settings:
 *                 type: object
 *     responses:
 *       200:
 *         description: Приложение обновлено
 */
router.put('/:id', authenticateToken, authorize('superadmin', 'admin'), applicationController.update);

/**
 * @swagger
 * /applications/{id}:
 *   delete:
 *     summary: Удалить приложение
 *     tags: [Applications]
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
 *         description: Приложение удалено
 */
router.delete('/:id', authenticateToken, authorize('superadmin'), applicationController.delete);

/**
 * @swagger
 * /applications/{id}/tariffs:
 *   get:
 *     summary: Получить тарифы приложения
 *     tags: [Applications]
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
 *         description: Список тарифов приложения
 */
router.get('/:id/tariffs', authenticateToken, authorize('admin', 'superadmin', 'support'), applicationController.getTariffs);

module.exports = router;