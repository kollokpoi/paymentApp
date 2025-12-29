const { PaymentDTO } = require('@payment-app/apiModels');

class PaymentController {
  async getAll(req, res, next) {
    try {
      const { page = 1, limit = 20, subscriptionId, status, startDate, endDate } = req.query;
      const offset = (page - 1) * limit;
      
      const Payment = req.db.getModel('Payment');
      const where = {};
      if (subscriptionId) where.subscription_id = subscriptionId;
      if (status) where.status = status;
      
      if (startDate || endDate) {
        where.created_at = {};
        if (startDate) where.created_at[req.db.sequelize.Op.gte] = new Date(startDate);
        if (endDate) where.created_at[req.db.sequelize.Op.lte] = new Date(endDate);
      }
      
      const { count, rows } = await Payment.findAndCountAll({
        where,
        include: [{
          model: req.db.getModel('Subscription'),
          as: 'subscription',
          include: [
            {
              model: req.db.getModel('Portal'),
              as: 'portal',
              attributes: ['id', 'b24_domain', 'company_name']
            },
            {
              model: req.db.getModel('Application'),
              as: 'application',
              attributes: ['id', 'name']
            }
          ]
        }],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']]
      });
      
      const payments = rows.map(payment => 
        PaymentDTO.fromSequelize(payment).toApiResponse()
      );
      
      res.json({
        success: true,
        data: payments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const Payment = req.db.getModel('Payment');
      const payment = await Payment.findByPk(req.params.id, {
        include: [{
          model: req.db.getModel('Subscription'),
          as: 'subscription',
          include: ['portal', 'application']
        }]
      });
      
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
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
      const Payment = req.db.getModel('Payment');
      const Subscription = req.db.getModel('Subscription');
      
      const { 
        subscription_id, external_id, amount, currency, 
        status, payment_method, description, metadata 
      } = req.body;
      
      if (!subscription_id || amount === undefined) {
        return res.status(400).json({
          success: false,
          message: 'subscription_id and amount are required'
        });
      }
      
      const subscription = await Subscription.findByPk(subscription_id);
      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: 'Subscription not found'
        });
      }
      
      const payment = await Payment.create({
        subscription_id,
        external_id,
        amount: parseFloat(amount),
        currency: currency || 'RUB',
        status: status || 'pending',
        payment_method,
        description,
        metadata: metadata || {}
      });
      
      if (status === 'completed') {
        await subscription.update({
          status: 'active'
        });
      }
      
      const paymentDTO = PaymentDTO.fromSequelize(payment);
      
      res.status(201).json({
        success: true,
        data: paymentDTO.toApiResponse(),
        message: 'Payment created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const Payment = req.db.getModel('Payment');
      const Subscription = req.db.getModel('Subscription');
      
      const payment = await Payment.findByPk(req.params.id);
      
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }
      
      const { status, external_id, description, metadata } = req.body;
      const oldStatus = payment.status;
      
      await payment.update({
        status,
        external_id,
        description,
        metadata: { ...payment.metadata, ...metadata }
      });
      
      if (oldStatus !== 'completed' && status === 'completed') {
        const subscription = await Subscription.findByPk(payment.subscription_id);
        if (subscription) {
          await subscription.update({ status: 'active' });
        }
      }
      
      const paymentDTO = PaymentDTO.fromSequelize(payment);
      res.json({
        success: true,
        data: paymentDTO.toApiResponse(),
        message: 'Payment updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async getStats(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      
      const Payment = req.db.getModel('Payment');
      const where = { status: 'completed' };
      
      if (startDate || endDate) {
        where.created_at = {};
        if (startDate) where.created_at[req.db.sequelize.Op.gte] = new Date(startDate);
        if (endDate) where.created_at[req.db.sequelize.Op.lte] = new Date(endDate);
      }
      
      const totalRevenue = await Payment.sum('amount', {
        where: { ...where, currency: 'RUB' }
      }) || 0;
      
      const totalPayments = await Payment.count({ where });
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const dailyStats = await Payment.findAll({
        where: {
          ...where,
          created_at: { [req.db.sequelize.Op.gte]: thirtyDaysAgo }
        },
        attributes: [
          [req.db.sequelize.fn('DATE', req.db.sequelize.col('created_at')), 'date'],
          [req.db.sequelize.fn('COUNT', req.db.sequelize.col('id')), 'count'],
          [req.db.sequelize.fn('SUM', req.db.sequelize.col('amount')), 'total']
        ],
        group: [req.db.sequelize.fn('DATE', req.db.sequelize.col('created_at'))],
        order: [[req.db.sequelize.fn('DATE', req.db.sequelize.col('created_at')), 'ASC']],
        raw: true
      });
      
      res.json({
        success: true,
        data: {
          totalRevenue,
          totalPayments,
          dailyStats
        }
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
        data: count
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PaymentController();