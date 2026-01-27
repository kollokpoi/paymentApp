const { PortalDTO, SubscriptionDTO } = require("@payment-app/apiModels");

class PortalController {
  async getAll(req, res, next) {
    try {
      const { page = 1, limit = 20, search, isActive } = req.query;
      const offset = (page - 1) * limit;

      const Portal = req.db.getModel("Portal");
      const where = {};

      if (search) {
        where[req.db.sequelize.Op.or] = [
          { b24_domain: { [req.db.sequelize.Op.like]: `%${search}%` } },
          { company_name: { [req.db.sequelize.Op.like]: `%${search}%` } },
          { admin_email: { [req.db.sequelize.Op.like]: `%${search}%` } },
        ];
      }
      if (isActive !== undefined) where.is_active = isActive === "true";

      const { count, rows } = await Portal.findAndCountAll({
        where,
        include: [
          {
            model: req.db.getModel("Subscription"),
            as: "subscriptions",
          },
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["created_at", "DESC"]],
      });

      const portals = rows.map((portal) =>
        PortalDTO.fromSequelize(portal).toApiResponse()
      );

      res.json({
        success: true,
        data: {
          items: portals,
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
  async getPortalsList(req, res, next) {
    try {
      const Portal = req.db.getModel("Portal");

      const portals = await Portal.findAll({
        attributes: ["id", "b24_domain", "company_name", "is_active", "balance"],
        order: [
          ["company_name", "ASC"],
          ["b24_domain", "ASC"],
        ],
      });

      const result = portals.map((portal) =>
        PortalDTO.fromSequelize(portal).toApiResponse()
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
  async getById(req, res, next) {
    try {
      const Portal = req.db.getModel("Portal");
      const portal = await Portal.findByPk(req.params.id, {
        include: [
          {
            model: req.db.getModel("Subscription"),
            as: "subscriptions",
            include: ["application", "tariff"],
          },
        ],
      });

      if (!portal) {
        return res.status(404).json({
          success: false,
          message: "Portal not found",
        });
      }

      const portalDTO = PortalDTO.fromSequelize(portal);
      res.json({ success: true, data: portalDTO.toApiResponse() });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const Portal = req.db.getModel("Portal");

      if (!req.body.b24_domain) {
        return res.status(400).json({
          success: false,
          message: "b24_domain are required",
        });
      }

      if (!req.body.company_name) {
        return res.status(400).json({
          success: false,
          message: "company_name required",
        });
      }

      const existing = await Portal.findOne({
        where: { b24_domain: req.body.b24_domain },
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Portal with this member_id or domain already exists",
        });
      }

      const portal = await Portal.create(req.body);
      const portalDTO = PortalDTO.fromSequelize(portal);

      res.status(201).json({
        success: true,
        data: portalDTO.toApiResponse(),
        message: "Portal created successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const Portal = req.db.getModel("Portal");
      const portal = await Portal.findByPk(req.params.id);

      if (!portal) {
        return res.status(404).json({
          success: false,
          message: "Portal not found",
        });
      }

      const {
        company_name,
        admin_email,
        is_active,
        b24_domain,
        metadata,
      } = req.body;

      if(admin_email =='')
        admin_email = null;
      
      await portal.update({
        company_name,
        admin_email,
        is_active,
        b24_domain,
        metadata: metadata || portal.metadata,
      });

      const portalDTO = PortalDTO.fromSequelize(portal);
      res.json({
        success: true,
        data: portalDTO.toApiResponse(),
        message: "Portal updated successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async search(req, res, next) {
    try {
      const { domain } = req.query;

      if (!domain) {
        return res.status(400).json({
          success: false,
          message: "Provide domain parameter",
        });
      }

      const Portal = req.db.getModel("Portal");
      const where = {};
      if (domain) where.b24_domain = domain;

      const portal = await Portal.findOne({
        where,
        include: ["subscriptions"],
      });

      if (!portal) {
        return res.status(404).json({
          success: false,
          message: "Portal not found",
        });
      }

      const portalDTO = PortalDTO.fromSequelize(portal);
      res.json({ success: true, data: portalDTO.toApiResponse() });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const Portal = req.db.getModel("Portal");
      const portal = await Portal.findByPk(req.params.id);

      if (!portal) {
        return res.status(404).json({
          success: false,
          message: "Portal not found",
        });
      }

      const Subscription = req.db.getModel("Subscription");
      const activeSubscriptions = await Subscription.count({
        where: {
          portal_id: portal.id,
          status: ["trial", "active"],
        },
      });

      if (activeSubscriptions > 0) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete portal with active subscriptions",
        });
      }

      await portal.destroy();

      res.json({
        success: true,
        message: "Portal deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async getStats(req, res, next) {
    try {
      const Portal = req.db.getModel("Portal");
      const portal = await Portal.findByPk(req.params.id);

      if (!portal) {
        return res.status(404).json({
          success: false,
          message: "Portal not found",
        });
      }

      const Subscription = req.db.getModel("Subscription");
      const subscriptions = await Subscription.findAll({
        where: { portalId: portal.id },
        include: [
          {
            model: Application,
            as: "application",
            attributes: ["id", "name", "code"],
          },
          {
            model: Tariff,
            as: "tariff",
            attributes: ["id", "name", "code", "price"],
          },
        ],
      });

      // Считаем статистику
      const activeSubscriptions = subscriptions.filter(
        (s) => s.status === "active"
      ).length;
      const trialSubscriptions = subscriptions.filter(
        (s) => s.status === "trial"
      ).length;
      const totalMonthlyRevenue = subscriptions
        .filter((s) => s.status === "active")
        .reduce((sum, sub) => {
          const tariff = sub.tariff;
          return sum + (tariff ? parseFloat(tariff.price) : 0);
        }, 0);

      res.json({
        success: true,
        data: {
          totalSubscriptions: subscriptions.length,
          activeSubscriptions,
          trialSubscriptions,
          totalMonthlyRevenue,
          subscriptions: subscriptions.map((sub) => ({
            id: sub.id,
            appName: sub.application?.name,
            tariffName: sub.tariff?.name,
            status: sub.status,
            validUntil: sub.validUntil,
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getActiveCount(req, res, next) {
    try {
      const Portal = req.db.getModel("Portal");
      const count = await Portal.count({
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

module.exports = new PortalController();
