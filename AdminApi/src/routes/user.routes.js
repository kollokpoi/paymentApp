const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller')
const { authenticateToken, authorize } = require('../middleware/auth');
/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Управление пользоваателями
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Получить список пользователей
 *     tags: [Users]
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
 *     responses:
 *       200:
 *         description: Список пользователей
 */
router.get('/', authenticateToken, authorize('superadmin'), userController.getAll);

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Создать нового пользователя
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [superadmin, admin, support]
 *     responses:
 *       201:
 *         description: Пользователь создан
 */
router.post('/', authenticateToken, authorize('superadmin'), userController.create);

/**
 * @swagger
 * /users/id:
 *   delete:
 *     summary: Удалить пользователя
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Пользователь создан
 */
router.delete('/:id', authenticateToken, authorize('superadmin'), userController.delete);


/**
 * @swagger
 * /users/count:
 *   get:
 *     summary: Получить количество пользователей
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Количество пользователей
 */
router.get('/count', authenticateToken, userController.getActiveCount);

/**
 * @swagger
 * /users/stats:
 *   get:
 *     summary: Получить статистику пользователей
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Статистика пользователей
 */
router.get('/stats', authenticateToken, authorize('superadmin'), userController.getAdminStats);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Получить пользователя по ID
 *     tags: [Users]
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
router.get('/:id', authenticateToken, authorize('superadmin'), userController.getById);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Обновить пользователя
 *     tags: [Users]
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
 *               - name
 *               - email
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [superadmin, admin, support]
 *     responses:
 *       200:
 *         description: Пользователь обновлен
 */
router.put('/:id', authenticateToken, authorize('superadmin'), userController.update);

/**
 * @swagger
 * /users/count:
 *   get:
 *     summary: Получить количество пользователей
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Количество пользователей
 */
router.get('/count', authenticateToken, userController.getActiveCount);

module.exports = router;