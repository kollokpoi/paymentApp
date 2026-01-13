const { ApplicationDTO, TariffDTO } = require("@payment-app/apiModels");

class ApplicationController {
  async getAll(req, res, next) {
    try {
      const { page = 1, limit = 20, search, isActive, version } = req.query;

      const offset = (page - 1) * limit;

      const Application = req.db.getModel("Application");
      const where = {};

      if (isActive !== undefined) {
        where.is_active = isActive === "true";
      }

      if (search) {
        where[req.db.sequelize.Op.or] = [
          { name: { [req.db.sequelize.Op.like]: `%${search}%` } },
          { description: { [req.db.sequelize.Op.like]: `%${search}%` } },
        ];
      }

      if (version) {
        where.version = { [req.db.sequelize.Op.like]: `%${version}%` };
      }

      const { count, rows } = await Application.findAndCountAll({
        where,
        include: [
          {
            model: req.db.getModel("Tariff"),
            as: "tariffs",
            where: { is_active: true },
            required: false,
          },
        ],
        order: [
          ["sort_order", "ASC"],
          ["name", "ASC"],
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      const result = rows.map((app) =>
        ApplicationDTO.fromSequelize(app).toApiResponse()
      );

      res.json({
        success: true,
        data: {
          items: result,
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit),
          hasNext: parseInt(page) < Math.ceil(count / limit),
          hasPrev: parseInt(page) > 1,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getShortList(req, res, next) {
    try {
      const Application = req.db.getModel("Application");
      const applications = await Application.findAll({
        attributes: ["id", "name", "is_active", "icon_url", "sort_order"],
        order: [
          ["sort_order", "ASC"],
          ["name", "ASC"],
        ],
      });

      const result = applications.map((app) =>
        ApplicationDTO.fromSequelize(app).toApiResponse()
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
  async getById(req, res, next) {
    try {
      const Application = req.db.getModel("Application");
      const application = await Application.findByPk(req.params.id, {
        include: ["tariffs"],
      });

      if (!application) {
        return res.status(404).json({
          success: false,
          message: "Application not found",
        });
      }

      const appDTO = ApplicationDTO.fromSequelize(application);
      res.json({ success: true, data: appDTO.toApiResponse() });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const Application = req.db.getModel("Application");
      const {
        client_id,
        client_secret,
        name,
        description,
        version,
        is_active,
        icon_url,
        settings,
        sort_order,
      } = req.body;

      if (!client_id || !client_secret || !name) {
        return res.status(400).json({
          success: false,
          message: "client_id, client_secret and name are required",
        });
      }

      const existing = await Application.findOne({ where: { client_id } });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Application with this client_id already exists",
        });
      }

      const application = await Application.create({
        client_id,
        client_secret,
        name,
        description,
        version,
        is_active: is_active !== undefined ? is_active : true,
        icon_url,
        settings: settings || {},
        sort_order,
      });

      const appDTO = ApplicationDTO.fromSequelize(application);

      res.status(201).json({
        success: true,
        data: appDTO.toApiResponse(),
        message: "Application created successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const Application = req.db.getModel("Application");
      const application = await Application.findByPk(req.params.id);

      if (!application) {
        return res.status(404).json({
          success: false,
          message: "Application not found",
        });
      }

      const {
        name,
        description,
        version,
        is_active,
        icon_url,
        settings,
        sort_order,
        client_id,
        client_secret,
      } = req.body;

      if (!client_id || !client_secret || !name) {
        return res.status(400).json({
          success: false,
          message: "client_id, client_secret and name are required",
        });
      }

      const existing = await Application.findOne({ where: { client_id } });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Application with this client_id already exists",
        });
      }
      
      await application.update({
        client_id,
        client_secret,
        name,
        description,
        version,
        is_active,
        icon_url,
        settings: { ...application.settings, ...settings },
        sort_order,
        updatedAt: new Date(),
      });

      const appDTO = ApplicationDTO.fromSequelize(application);
      res.json({
        success: true,
        data: appDTO.toApiResponse(),
        message: "Application updated successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const Application = req.db.getModel("Application");
      const Subscription = req.db.getModel("Subscription");

      const application = await Application.findByPk(req.params.id);

      if (!application) {
        return res.status(404).json({
          success: false,
          message: "Application not found",
        });
      }

      const activeSubscriptions = await Subscription.count({
        where: {
          app_id: application.id,
          status: ["trial", "active"],
        },
      });

      if (activeSubscriptions > 0) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete application with active subscriptions",
        });
      }

      await application.destroy();

      res.json({
        success: true,
        message: "Application deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async getStat(req, res, next) {
    try {
      const Application = req.db.getModel("Application");

      const statistics = await Application.findAll({
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
        ],
        raw: true,
      });

      res.json({
        success: true,
        data: statistics[0] || {
          total: 0,
          active: 0,
          inactive: 0,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getActiveCount(req, res, next) {
    try {
      const Application = req.db.getModel("Application");
      const count = await Application.count({
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

module.exports = new ApplicationController();
