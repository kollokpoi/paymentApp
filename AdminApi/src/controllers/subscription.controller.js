const {
  SubscriptionDTO,
  PERIOD_VALUES
} = require("@payment-app/apiModels");

class SubscriptionController {
  async getAll(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        tariffId,
        portalId,
        appId,
        status,
        search,
      } = req.query;
      const offset = (page - 1) * limit;

      const Subscription = req.db.getModel("Subscription");
      const { Op } = req.db.sequelize;
      const where = {};

      if (portalId) where.portal_id = portalId;
      if (appId) where.app_id = appId;
      if (status) where.status = status;
      if (tariffId) where.tariff_id = tariffId;

      let includeWhere = {};

      if (search) {
        includeWhere = {
          [Op.or]: [
            { "$application.name$": { [Op.like]: `%${search}%` } },
            { notes: { [Op.like]: `%${search}%` } },
          ],
        };
      }

      const { count, rows } = await Subscription.findAndCountAll({
        where,
        include: [
          {
            model: req.db.getModel("Application"),
            as: "application",
            attributes: ["id", "name"],
            where: search
              ? { name: { [Op.like]: `%${search}%` } }
              : undefined,
          },
          {
            model: req.db.getModel("Tariff"),
            as: "tariff",
            attributes: ["id", "name", "code", "price", "period"],
          },
          {
            model: req.db.getModel("Portal"),
            as: "portal",
            attributes: ["id", "b24_domain", "company_name"],
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
        data: {
          items: subscriptions,
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

      const Portal = req.db.getModel("Portal");
      const Application = req.db.getModel("Application");
      const Tariff = req.db.getModel("Tariff");

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

      const Subscription = req.db.getModel("Subscription");
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

      if (status !== "trial" && portal.balance < tariff.amount) {
        return res.status(400).json({
          success: false,
          message:
            "На балансе портала недостаточно средств",
        });
      } else {
        await portal.update({
          balance: portal.balance - tariff.amount
        })
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
          case PERIOD_VALUES.DAY:
            endDate.setDate(endDate.getDate() + 1);
            break;
          case PERIOD_VALUES.WEEK:
            endDate.setDate(endDate.getDate() + 7);
            break;
          case PERIOD_VALUES.YEAR:
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
        used_limits: {}
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

      const { days, amount } = req.body;

      if (!amount) {
        return res.status(400).json({
          success: false,
          message: "Укажите сумму",
        });
      }

      if (!days && !subscription.tariff) {
        return res.status(400).json({
          success: false,
          message: "Provide days or subscription must have a tariff",
        });
      }

      const portal = await subscription.getPortal();

      if (portal.balance < amount) {
        return res.status(400).json({
          success: false,
          message: "Портал имеет недостаточно средств",
        });
      }


      const newValidUntil = new Date(subscription.valid_until);

      if (days) {
        newValidUntil.setDate(newValidUntil.getDate() + parseInt(days));
      } else {
        switch (subscription.tariff.period) {
          case PERIOD_VALUES.DAY:
            newValidUntil.setDate(newValidUntil.getDate() + 1);
            break;
          case PERIOD_VALUES.WEEK:
            newValidUntil.setDate(newValidUntil.getDate() + 7);
            break;
          case PERIOD_VALUES.YEAR:
            newValidUntil.setFullYear(newValidUntil.getFullYear() + 1);
            break;
          default:
            newValidUntil.setMonth(newValidUntil.getMonth() + 1);
        }
      }
      
      await portal.update({
        balance: portal.balance - amount
      })

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
          case PERIOD_VALUES.DAY:
            newValidUntil.setDate(newValidUntil.getDate() + 1);
            break;
          case PERIOD_VALUES.WEEK:
            newValidUntil.setDate(newValidUntil.getDate() + 7);
            break;
          case PERIOD_VALUES.YEAR:
            newValidUntil.setFullYear(newValidUntil.getFullYear() + 1);
            break;
          default:
            newValidUntil.setMonth(newValidUntil.getMonth() + 1);
        }

        await subscription.update({ valid_until: newValidUntil, used_limits: {} });
      } else {
        await subscription.update({ tariff_id, used_limits: {} });
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
          status: "active",
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
      const Subscription = req.db.getModel("Subscription");

      const subscription = await Subscription.findByPk(req.params.id);

      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: "Subscription not found",
        });
      }

      await subscription.destroy();

      res.json({
        success: true,
        message: "Subscription deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async getStats(req, res, next) {
    try {
      const Subscription = req.db.getModel("Subscription");
      const Tariff = req.db.getModel("Tariff");
      const Application = req.db.getModel("Application");
      const Portal = req.db.getModel("Portal");
      const { Op } = req.db.sequelize;

      const { startDate, endDate, appId } = req.query;
      const now = new Date();

      const where = {};
      if (startDate || endDate) {
        where.created_at = {};
        if (startDate) where.created_at[Op.gte] = new Date(startDate);
        if (endDate) where.created_at[Op.lte] = new Date(endDate);
      }
      if (appId) where.app_id = appId;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(now.getMonth() - 6);

      const weekFromNow = new Date();
      weekFromNow.setDate(now.getDate() + 7);

      const [
        statusCounts,
        total,
        activeWithTrial,
        expiringCount,
        monthlyStats,
        dailyStats,
        appStats,
        portalStats,
        activeSubscriptions,
      ] = await Promise.all([
        Subscription.findAll({
          where,
          attributes: [
            "status",
            [req.db.sequelize.fn("COUNT", req.db.sequelize.col("id")), "count"],
          ],
          group: ["status"],
          raw: true,
        }),
        Subscription.count({ where }),
        Subscription.count({
          where: {
            ...where,
            status: ["trial", "active"],
            valid_until: { [Op.gt]: now },
          },
        }),
        Subscription.count({
          where: {
            ...where,
            status: ["trial", "active"],
            valid_until: { [Op.between]: [now, weekFromNow] },
          },
        }),
        Subscription.findAll({
          where: {
            ...where,
            created_at: { [Op.gte]: sixMonthsAgo },
          },
          attributes: [
            [
              req.db.sequelize.fn(
                "DATE_FORMAT",
                req.db.sequelize.col("created_at"),
                "%Y-%m"
              ),
              "month",
            ],
            [req.db.sequelize.fn("COUNT", req.db.sequelize.col("id")), "count"],
          ],
          group: [
            req.db.sequelize.fn(
              "DATE_FORMAT",
              req.db.sequelize.col("created_at"),
              "%Y-%m"
            ),
          ],
          order: [[req.db.sequelize.literal("month"), "ASC"]],
          raw: true,
        }),
        Subscription.findAll({
          where: {
            ...where,
            created_at: { [Op.gte]: thirtyDaysAgo },
          },
          attributes: [
            [
              req.db.sequelize.fn("DATE", req.db.sequelize.col("created_at")),
              "date",
            ],
            [req.db.sequelize.fn("COUNT", req.db.sequelize.col("id")), "count"],
          ],
          group: [
            req.db.sequelize.fn("DATE", req.db.sequelize.col("created_at")),
          ],
          order: [[req.db.sequelize.literal("date"), "ASC"]],
          raw: true,
        }),
        Subscription.findAll({
          where,
          include: [
            {
              model: Application,
              as: "application",
              attributes: ["id", "name"],
            },
          ],
          attributes: [
            "app_id",
            [
              req.db.sequelize.fn(
                "COUNT",
                req.db.sequelize.col("Subscription.id")
              ),
              "count",
            ],
          ],
          group: ["app_id"],
          raw: true,
        }),
        Subscription.findAll({
          where,
          include: [
            {
              model: Portal,
              as: "portal",
              attributes: ["id", "company_name", "b24_domain"],
            },
          ],
          attributes: [
            "portal_id",
            [
              req.db.sequelize.fn(
                "COUNT",
                req.db.sequelize.col("Subscription.id")
              ),
              "count",
            ],
          ],
          group: ["portal_id"],
          raw: true,
        }),
        Subscription.findAll({
          where: {
            ...where,
            status: "active",
          },
          include: [
            {
              model: Tariff,
              as: "tariff",
              attributes: ["price"],
            },
          ],
          raw: true,
        }),
      ]);

      const statusStats = {};
      statusCounts.forEach((item) => {
        statusStats[item.status] = parseInt(item.count);
      });

      let monthlyRevenue = 0;
      activeSubscriptions.forEach((sub) => {
        if (sub["tariff.price"]) {
          monthlyRevenue += parseFloat(sub["tariff.price"]);
        }
      });

      const activeCount = statusStats.active || 0;
      const trialCount = statusStats.trial || 0;

      const responseData = {
        total,
        active: activeCount,
        trial: trialCount,
        activeCount,
        suspended: statusStats.suspended || 0,
        cancelled: statusStats.cancelled || 0,
        expired: statusStats.expired || 0,
        activeWithTrial,
        expiring: expiringCount,
        monthlyRevenue,
        monthlyStats: monthlyStats.map((item) => ({
          month: item.month + "-01",
          count: parseInt(item.count),
        })),
        dailyStats: dailyStats.map((item) => ({
          date: item.date,
          count: parseInt(item.count),
        })),
        appStats: appStats
          .map((item) => ({
            appId: item.app_id,
            appName: item["application.name"] || "Без названия",
            count: parseInt(item.count),
          }))
          .sort((a, b) => b.count - a.count),
        portalStats: portalStats
          .map((item) => ({
            portalId: item.portal_id,
            portalName:
              item["portal.company_name"] ||
              item["portal.b24_domain"] ||
              "Без названия",
            count: parseInt(item.count),
          }))
          .sort((a, b) => b.count - a.sort)
          .slice(0, 10),
        summary: {
          activePercentage:
            total > 0 ? Math.round((activeCount / total) * 100) : 0,
          trialPercentage:
            total > 0 ? Math.round((trialCount / total) * 100) : 0,
          renewalRate: total > 0 ? Math.round((activeCount / total) * 100) : 0,
          churnRate:
            total > 0
              ? Math.round(((statusStats.cancelled || 0) / total) * 100)
              : 0,
        },
      };

      res.json({
        success: true,
        data: responseData,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SubscriptionController();
