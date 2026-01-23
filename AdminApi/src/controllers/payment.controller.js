const { PaymentDTO } = require("@payment-app/apiModels");

class PaymentController {
  async getAll(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        subscriptionId,
        status,
        dateFrom,
        dateTo,
        portalId,
        appId,
        paymentMethod,
        amountFrom,
        amountTo,
        search,
      } = req.query;

      const offset = (page - 1) * limit;

      const Payment = req.db.getModel("Payment");
      const where = {};

      if (subscriptionId) where.subscription_id = subscriptionId;
      if (status) where.status = status;
      if (paymentMethod) where.payment_method = paymentMethod;

      if (dateFrom || dateTo) {
        where.created_at = {};
        if (dateFrom)
          where.created_at[req.db.sequelize.Op.gte] = new Date(dateFrom);
        if (dateTo)
          where.created_at[req.db.sequelize.Op.lte] = new Date(dateTo);
      }

      if (amountFrom || amountTo) {
        where.amount = {};
        if (amountFrom)
          where.amount[req.db.sequelize.Op.gte] = parseFloat(amountFrom);
        if (amountTo)
          where.amount[req.db.sequelize.Op.lte] = parseFloat(amountTo);
      }

      if (search) {
        where[req.db.sequelize.Op.or] = [
          { description: { [req.db.sequelize.Op.like]: `%${search}%` } },
          { external_id: { [req.db.sequelize.Op.like]: `%${search}%` } },
        ];
      }

      const include = [
        {
          model: req.db.getModel("Subscription"),
          as: "subscription",
          where: {},
          required: true,
          include: [
            {
              model: req.db.getModel("Portal"),
              as: "portal",
              attributes: ["id", "b24_domain", "company_name"],
              where: {},
              required: portalId ? true : false,
            },
            {
              model: req.db.getModel("Application"),
              as: "application",
              attributes: ["id", "name"],
              where: {},
              required: appId ? true : false,
            },
          ],
        },
      ];

      if (portalId) {
        include[0].include[0].where.id = portalId;
      }

      if (appId) {
        include[0].include[1].where.id = appId;
      }

      const { count, rows } = await Payment.findAndCountAll({
        where,
        include,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["created_at", "DESC"]],
      });

      const payments = rows.map((payment) =>
        PaymentDTO.fromSequelize(payment).toApiResponse()
      );

      res.json({
        success: true,
        data: {
          items: payments,
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
      const Payment = req.db.getModel("Payment");
      const payment = await Payment.findByPk(req.params.id, {
        include: [
          {
            model: req.db.getModel("Subscription"),
            as: "subscription",
            include: ["portal", "application"],
          },
        ],
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: "Payment not found",
        });
      }

      const paymentDTO = PaymentDTO.fromSequelize(payment);
      res.json({ success: true, data: paymentDTO.toApiResponse() });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const Payment = req.db.getModel("Payment");
      const Subscription = req.db.getModel("Subscription");

      const {
        subscription_id,
        external_id,
        amount,
        status,
        payment_method,
        description,
        metadata,
      } = req.body;

      if (!subscription_id || amount === undefined) {
        return res.status(400).json({
          success: false,
          message: "subscription_id and amount are required",
        });
      }

      const subscription = await Subscription.findByPk(subscription_id);
      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: "Subscription not found",
        });
      }
      const portal = await subscription.getPortal();
      await portal.update({
        balance: parseFloat(portal.balance) + parseFloat(amount)
      })

      const payment = await Payment.create({
        subscription_id,
        external_id,
        amount: parseFloat(amount),
        status: status || "pending",
        payment_method,
        description,
        metadata: metadata || {},
      });

      const paymentDTO = PaymentDTO.fromSequelize(payment);

      res.status(201).json({
        success: true,
        data: paymentDTO.toApiResponse(),
        message: "Payment created successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const Payment = req.db.getModel("Payment");
      const Subscription = req.db.getModel("Subscription");

      const payment = await Payment.findByPk(req.params.id);

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: "Payment not found",
        });
      }

      const { status, external_id, description, metadata } = req.body;
      const oldStatus = payment.status;

      await payment.update({
        status,
        external_id,
        description,
        metadata: { ...payment.metadata, ...metadata },
      });

      if (oldStatus !== "completed" && status === "completed") {
        const subscription = await Subscription.findByPk(
          payment.subscription_id
        );
        if (subscription) {
          await subscription.update({ status: "active" });
        }
      }

      const paymentDTO = PaymentDTO.fromSequelize(payment);
      res.json({
        success: true,
        data: paymentDTO.toApiResponse(),
        message: "Payment updated successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async getStats(req, res, next) {
    try {
      const { startDate, endDate } = req.query;

      const Payment = req.db.getModel("Payment");
      const where = { status: "completed" };

      if (startDate || endDate) {
        where.created_at = {};
        if (startDate)
          where.created_at[req.db.sequelize.Op.gte] = new Date(startDate);
        if (endDate)
          where.created_at[req.db.sequelize.Op.lte] = new Date(endDate);
      }

      const totalRevenue =
        (await Payment.sum("amount", {
          where: { ...where },
        })) || 0;

      const totalPayments = await Payment.count({ where });

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const dailyStats = await Payment.findAll({
        where: {
          ...where,
          created_at: { [req.db.sequelize.Op.gte]: thirtyDaysAgo },
        },
        attributes: [
          [
            req.db.sequelize.fn("DATE", req.db.sequelize.col("created_at")),
            "date",
          ],
          [req.db.sequelize.fn("COUNT", req.db.sequelize.col("id")), "count"],
          [req.db.sequelize.fn("SUM", req.db.sequelize.col("amount")), "total"],
        ],
        group: [
          req.db.sequelize.fn("DATE", req.db.sequelize.col("created_at")),
        ],
        order: [
          [
            req.db.sequelize.fn("DATE", req.db.sequelize.col("created_at")),
            "ASC",
          ],
        ],
        raw: true,
      });

      res.json({
        success: true,
        data: {
          totalRevenue,
          totalPayments,
          dailyStats,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getActiveCount(req, res, next) {
    try {
      const Payment = req.db.getModel("Payment");
      const count = await Payment.count();

      res.json({
        success: true,
        data: count,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PaymentController();
