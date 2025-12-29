const express = require('express');
const router = express.Router();
const portalController = require('../controllers/portal.controller');
const { authenticateToken, authorize } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Portals
 *   description: Управление порталами Bitrix24
 */

/**
 * @swagger
 * /portals:
 *   get:
 *     summary: Получить список порталов
 *     tags: [Portals]
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
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Список порталов
 */
router.get('/', authenticateToken, authorize('admin', 'superadmin', 'support'), portalController.getAll);

/**
 * @swagger
 * /portals/search:
 *   get:
 *     summary: Поиск портала
 *     tags: [Portals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: memberId
 *         schema:
 *           type: string
 *       - in: query
 *         name: domain
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Найденный портал
 */
router.get('/search', authenticateToken, authorize('admin', 'superadmin', 'support'), portalController.search);

/**
 * @swagger
 * /portals/count:
 *   get:
 *     summary: Получить количество порталов
 *     tags: [Portals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Количество порталов
 */
router.get('/count', authenticateToken, portalController.getActiveCount);

/**
 * @swagger
 * /portals/{id}:
 *   get:
 *     summary: Получить портал по ID
 *     tags: [Portals]
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
 *         description: Данные портала
 */
router.get('/:id', authenticateToken, authorize('admin', 'superadmin', 'support'), portalController.getById);

/**
 * @swagger
 * /portals/{id}:
 *   put:
 *     summary: Обновить портал
 *     tags: [Portals]
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
 *               companyName:
 *                 type: string
 *               adminEmail:
 *                 type: string
 *                 format: email
 *               isActive:
 *                 type: boolean
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Портала обновлен
 *       404:
 *         description: Портала не найден
 */
router.put('/:id', authenticateToken, authorize('admin', 'superadmin', 'support'), portalController.update);

/**
 * @swagger
 * /portals:
 *   post:
 *     summary: Создать новый портал
 *     tags: [Portals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - b24MemberId
 *               - b24Domain
 *             properties:
 *               b24MemberId:
 *                 type: string
 *               b24Domain:
 *                 type: string
 *               companyName:
 *                 type: string
 *               adminEmail:
 *                 type: string
 *                 format: email
 *               isActive:
 *                 type: boolean
 *               b24AccessToken:
 *                 type: string
 *               b24RefreshToken:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Портала создан
 */
router.post('/', authenticateToken, authorize('superadmin', 'admin'), portalController.create);

/**
 * @swagger
 * /portals/{id}:
 *   delete:
 *     summary: Удалить портал
 *     tags: [Portals]
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
 *         description: Портала удален
 */
router.delete('/:id', authenticateToken, authorize('superadmin'), portalController.delete);

/**
 * @swagger
 * /portals/{id}/stats:
 *   get:
 *     summary: Получить статистику портала
 *     tags: [Portals]
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
 *         description: Статистика портала
 */
router.get('/:id/stats', authenticateToken, authorize('admin', 'superadmin', 'support'), portalController.getStats);

/**
 * @swagger
 * /portals/count:
 *   get:
 *     summary: Получить количество порталов
 *     tags: [Portals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Количество порталов
 */
router.get('/count', authenticateToken, portalController.getActiveCount);

module.exports = router;