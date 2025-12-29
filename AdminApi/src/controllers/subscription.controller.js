const {
  SubscriptionDTO,
  PortalDTO,
  ApplicationDTO,
  TariffDTO,
} = require("@payment-app/apiModels");

class SubscriptionController {
  async getAll(req, res, next) {
    try {
      const { page = 1, limit = 20, portalId, appId, status } = req.query;
      const offset = (page - 1) * limit;

      const Subscription = req.db.getModel("Subscription");
      const where = {};
      if (portalId) where.portal_id = portalId;
      if (appId) where.app_id = appId;
      if (status) where.status = status;

      const { count, rows } = await Subscription.findAndCountAll({
        where,
        include: [
          {
            model: req.db.getModel("Portal"),
            as: "portal",
            attributes: ["id", "b24_domain", "company_name", "admin_email"],
          },
          {
            model: req.db.getModel("Application"),
            as: "application",
            attributes: ["id", "name", "code"],
          },
          {
            model: req.db.getModel("Tariff"),
            as: "tariff",
            attributes: ["id", "name", "code", "price", "period"],
          },
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["created_at", "DESC"]],
      });

      const subscriptions = rows.map((sub) =>
        SubscriptionDTO.fromSequelize(sub).toApiResponse()
      );

      res.json({
        success: true,
        data: subscriptions,
        pagination: {
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
      const Subscription = req.db.getModel("Subscription");
      const subscription = await Subscription.findByPk(req.params.id, {
        include: ["portal", "application", "tariff"],
      });

      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: "Subscription not found",
        });
      }

      const subscriptionDTO = SubscriptionDTO.fromSequelize(subscription);
      res.json({ success: true, data: subscriptionDTO.toApiResponse() });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const Subscription = req.db.getModel("Subscription");
      const Portal = req.db.getModel("Portal");
      const Application = req.db.getModel("Application");
      const Tariff = req.db.getModel("Tariff");

      const {
        portal_id,
        app_id,
        tariff_id,
        status,
        valid_from,
        valid_until,
        auto_renew,
        trial_end_date,
        notes,
      } = req.body;

      if (!portal_id || !app_id || !tariff_id) {
        return res.status(400).json({
          success: false,
          message: "portal_id, app_id and tariff_id are required",
        });
      }

      const [portal, application, tariff] = await Promise.all([
        Portal.findByPk(portal_id),
        Application.findByPk(app_id),
        Tariff.findByPk(tariff_id),
      ]);

      if (!portal)
        return res
          .status(404)
          .json({ success: false, message: "Portal not found" });
      if (!application)
        return res
          .status(404)
          .json({ success: false, message: "Application not found" });
      if (!tariff)
        return res
          .status(404)
          .json({ success: false, message: "Tariff not found" });

      const existing = await Subscription.findOne({
        where: {
          portal_id,
          app_id,
          status: ["trial", "active"],
        },
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message:
            "Active subscription already exists for this portal and application",
        });
      }

      const now = new Date();
      const startDate = valid_from ? new Date(valid_from) : now;
      let endDate;

      if (valid_until) {
        endDate = new Date(valid_until);
      } else if (status === "trial" && tariff.trial_days > 0) {
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + tariff.trial_days);
      } else {
        endDate = new Date(startDate);
        switch (tariff.period) {
          case "day":
            endDate.setDate(endDate.getDate() + 1);
            break;
          case "week":
            endDate.setDate(endDate.getDate() + 7);
            break;
          case "year":
            endDate.setFullYear(endDate.getFullYear() + 1);
            break;
          default:
            endDate.setMonth(endDate.getMonth() + 1);
        }
      }

      const subscription = await Subscription.create({
        portal_id,
        app_id,
        tariff_id,
        status: status || "trial",
        valid_from: startDate,
        valid_until: endDate,
        auto_renew: auto_renew !== undefined ? auto_renew : true,
        trial_end_date: trial_end_date ? new Date(trial_end_date) : null,
        notes,
      });

      const subscriptionDTO = SubscriptionDTO.fromSequelize(subscription);

      res.status(201).json({
        success: true,
        data: subscriptionDTO.toApiResponse(),
        message: "Subscription created successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const Subscription = req.db.getModel("Subscription");
      const subscription = await Subscription.findByPk(req.params.id);

      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: "Subscription not found",
        });
      }

      const { status, valid_until, auto_renew, notes } = req.body;

      await subscription.update({
        status,
        valid_until: valid_until
          ? new Date(valid_until)
          : subscription.valid_until,
        auto_renew,
        notes,
      });

      const subscriptionDTO = SubscriptionDTO.fromSequelize(subscription);
      res.json({
        success: true,
        data: subscriptionDTO.toApiResponse(),
        message: "Subscription updated successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async renew(req, res, next) {
    try {
      const Subscription = req.db.getModel("Subscription");

      const subscription = await Subscription.findByPk(req.params.id, {
        include: ["tariff"],
      });

      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: "Subscription not found",
        });
      }

      const { days } = req.body;

      if (!days && !subscription.tariff) {
        return res.status(400).json({
          success: false,
          message: "Provide days or subscription must have a tariff",
        });
      }

      const newValidUntil = new Date(subscription.valid_until);

      if (days) {
        newValidUntil.setDate(newValidUntil.getDate() + parseInt(days));
      } else {
        switch (subscription.tariff.period) {
          case "day":
            newValidUntil.setDate(newValidUntil.getDate() + 1);
            break;
          case "week":
            newValidUntil.setDate(newValidUntil.getDate() + 7);
            break;
          case "year":
            newValidUntil.setFullYear(newValidUntil.getFullYear() + 1);
            break;
          default:
            newValidUntil.setMonth(newValidUntil.getMonth() + 1);
        }
      }

      await subscription.update({
        valid_until: newValidUntil,
        status: "active",
      });

      const subscriptionDTO = SubscriptionDTO.fromSequelize(subscription);
      res.json({
        success: true,
        data: subscriptionDTO.toApiResponse(),
        message: "Subscription renewed successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async changeTariff(req, res, next) {
    try {
      const Subscription = req.db.getModel("Subscription");
      const Tariff = req.db.getModel("Tariff");

      const subscription = await Subscription.findByPk(req.params.id);

      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: "Subscription not found",
        });
      }

      const { tariff_id, immediate } = req.body;

      const tariff = await Tariff.findByPk(tariff_id);
      if (!tariff) {
        return res.status(404).json({
          success: false,
          message: "Tariff not found",
        });
      }

      if (tariff.app_id !== subscription.app_id) {
        return res.status(400).json({
          success: false,
          message: "Tariff does not belong to the same application",
        });
      }

      if (immediate) {
        await subscription.update({
          tariff_id,
          status: "active",
        });

        const newValidUntil = new Date();
        switch (tariff.period) {
          case "day":
            newValidUntil.setDate(newValidUntil.getDate() + 1);
            break;
          case "week":
            newValidUntil.setDate(newValidUntil.getDate() + 7);
            break;
          case "year":
            newValidUntil.setFullYear(newValidUntil.getFullYear() + 1);
            break;
          default:
            newValidUntil.setMonth(newValidUntil.getMonth() + 1);
        }

        await subscription.update({ valid_until: newValidUntil });
      } else {
        await subscription.update({ tariff_id });
      }

      const subscriptionDTO = SubscriptionDTO.fromSequelize(subscription);
      res.json({
        success: true,
        data: subscriptionDTO.toApiResponse(),
        message: immediate
          ? "Tariff changed immediately"
          : "Tariff will be changed on next renewal",
      });
    } catch (error) {
      next(error);
    }
  }

  async getActiveCount(req, res, next) {
    try {
      const Subscription = req.db.getModel("Subscription");
      const count = await Subscription.count({
        where: {
          status: 'active',
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

  async delete(req, res, next) {
    try {
      const Subscription = req.db.getModel('Subscription');
      
      const subscription = await Subscription.findByPk(req.params.id);
      
      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: 'Subscription not found'
        });
      }
      
      await subscription.destroy();
      
      res.json({
        success: true,
        message: 'Subscription deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SubscriptionController();
