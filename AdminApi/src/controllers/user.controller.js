const { AdminUserDTO, USER_ROLES } = require("@payment-app/apiModels");

class UserController {
  async getAll(req, res, next) {
    try {
      const { page = 1, limit = 20, search, role, isActive } = req.query;

      const offset = (page - 1) * limit;

      const AdminUser = req.db.getModel("AdminUser");
      const { Op } = req.db.sequelize;

      const where = {};

      // Фильтр по роли
      if (role) {
        where.role = role;
      }

      // Фильтр по статусу активности
      if (isActive !== undefined) {
        where.is_active = isActive === "true";
      }

      // Поиск по email или имени
      if (search) {
        where[Op.or] = [
          { email: { [Op.like]: `%${search}%` } },
          { name: { [Op.like]: `%${search}%` } },
        ];
      }

      const { count, rows } = await AdminUser.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [
          ["last_login", "DESC"],
          ["created_at", "DESC"],
        ],
      });

      const result = rows.map((user) =>
        AdminUserDTO.fromSequelize(user).toApiResponse()
      );

      res.json({
        success: true,
        data: {
          items: result,
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const AdminUser = req.db.getModel("AdminUser");
      const user = await AdminUser.findByPk(req.params.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const userDTO = AdminUserDTO.fromSequelize(user);
      res.json({ success: true, data: userDTO.toApiResponse() });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const { email, password, name, role } = req.body;

      if (!email || !password || !name || !role) {
        return res.status(400).json({
          success: false,
          message: "email, name, password and role are required",
        });
      }
      const AdminUser = req.db.getModel("AdminUser");
      const adminUser = await AdminUser.create({
        email,
        password,
        name,
        role,
      });

      const adminUserDTO = AdminUserDTO.fromSequelize(adminUser);

      res.status(201).json({
        success: true,
        data: adminUserDTO.toApiResponse(),
        message: "User created successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { email, password, name, role } = req.body;

      if (!email || !name || !role) {
        return res.status(400).json({
          success: false,
          message: "email, name and role are required",
        });
      }

      const userId = req.params.id;
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "id required",
        });
      }

      const AdminUser = req.db.getModel("AdminUser");
      const user = await AdminUser.findByPk(req.params.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
      const updates = {
        email,
        name,
        role,
      }
      if (password)
        updates.password = password

      await user.update(updates);

      const adminUserDTO = AdminUserDTO.fromSequelize(user);
      res.json({
        success: true,
        data: adminUserDTO.toApiResponse(),
        message: "Payment updated successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const userId = req.params.id;
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "id required",
        });
      }

      const AdminUser = req.db.getModel("AdminUser");
      const user = await AdminUser.findByPk(req.params.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if ([USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN].includes(user.role)) {
        return res.status(400).json({
          success: false,
          message: "Нельзя удалить администратора",
        });
      }
      
      await user.destroy();

      res.json({
        success: true,
        message: "Пользователь успешно удален",
      });
    } catch (error) {
      next(error);
    }
  }

  async getAdminStats(req, res, next) {
    try {
      const AdminUser = req.db.getModel("AdminUser");

      const statistics = await AdminUser.findAll({
        attributes: [
          [req.db.sequelize.fn("COUNT", req.db.sequelize.col("id")), "total"],
          [
            req.db.sequelize.fn(
              "SUM",
              req.db.sequelize.literal(
                "CASE WHEN is_active = true THEN 1 ELSE 0 END"
              )
            ),
            "active",
          ],
          [
            req.db.sequelize.fn(
              "SUM",
              req.db.sequelize.literal(
                "CASE WHEN is_active = false THEN 1 ELSE 0 END"
              )
            ),
            "inactive",
          ],
          [
            req.db.sequelize.fn(
              "COUNT",
              req.db.sequelize.literal(
                'CASE WHEN role = "superadmin" THEN 1 END'
              )
            ),
            "superadmins",
          ],
          [
            req.db.sequelize.fn(
              "COUNT",
              req.db.sequelize.literal('CASE WHEN role = "admin" THEN 1 END')
            ),
            "admins",
          ],
          [
            req.db.sequelize.fn(
              "COUNT",
              req.db.sequelize.literal('CASE WHEN role = "support" THEN 1 END')
            ),
            "support",
          ],
        ],
        raw: true,
      });

      const lastLogins = await AdminUser.findAll({
        attributes: ["id", "email", "name", "role", "last_login", "is_active"],
        where: {
          last_login: {
            [req.db.sequelize.Op.not]: null,
          },
        },
        order: [["last_login", "DESC"]],
        limit: 10,
      });

      const lastLoginDTOs = lastLogins.map((admin) =>
        AdminUserDTO.fromSequelize(admin).toApiResponse()
      );

      res.json({
        success: true,
        data: {
          statistics: statistics[0] || {
            total: 0,
            active: 0,
            inactive: 0,
            superadmins: 0,
            admins: 0,
            support: 0,
          },
          recentActivity: lastLoginDTOs,
          summary: {
            totalUsers: statistics[0]?.total || 0,
            activeUsers: statistics[0]?.active || 0,
            byRole: {
              superadmin: statistics[0]?.superadmins || 0,
              admin: statistics[0]?.admins || 0,
              support: statistics[0]?.support || 0,
            },
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getActiveCount(req, res, next) {
    try {
      const AdminUser = req.db.getModel("AdminUser");
      const count = await AdminUser.count({
        where: {
          is_active: true,
        },
      });

      res.json({
        success: true,
        data: count,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
