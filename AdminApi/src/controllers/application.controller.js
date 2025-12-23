const { ApplicationDTO, TariffDTO } = require('@payment-app/apiModels');

class ApplicationController {
  async getAll(req, res, next) {
    try {
      const Application = req.db.getModel('Application');
      const applications = await Application.findAll({
        order: [['name', 'ASC']],
        include: [{
          model: req.db.getModel('Tariff'),
          as: 'tariffs',
          where: { is_active: true },
          required: false
        }]
      });
      
      const result = applications.map(app => 
        ApplicationDTO.fromSequelize(app).toApiResponse()
      );
      
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const Application = req.db.getModel('Application');
      const application = await Application.findByPk(req.params.id, {
        include: ['tariffs']
      });
      
      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Application not found'
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
      const Application = req.db.getModel('Application');
      const { code, name, description, version, is_active, icon_url, settings } = req.body;
      
      if (!code || !name) {
        return res.status(400).json({
          success: false,
          message: 'code and name are required'
        });
      }
      
      const existing = await Application.findOne({ where: { code } });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Application with this code already exists'
        });
      }
      
      const application = await Application.create({
        code,
        name,
        description,
        version,
        is_active: is_active !== undefined ? is_active : true,
        icon_url,
        settings: settings || {}
      });
      
      const appDTO = ApplicationDTO.fromSequelize(application);
      
      res.status(201).json({
        success: true,
        data: appDTO.toApiResponse(),
        message: 'Application created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const Application = req.db.getModel('Application');
      const application = await Application.findByPk(req.params.id);
      
      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Application not found'
        });
      }
      
      const { name, description, version, is_active, icon_url, settings } = req.body;
      
      await application.update({
        name,
        description,
        version,
        is_active,
        icon_url,
        settings: { ...application.settings, ...settings }
      });
      
      const appDTO = ApplicationDTO.fromSequelize(application);
      res.json({
        success: true,
        data: appDTO.toApiResponse(),
        message: 'Application updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const Application = req.db.getModel('Application');
      const Subscription = req.db.getModel('Subscription');
      
      const application = await Application.findByPk(req.params.id);
      
      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Application not found'
        });
      }
      
      const activeSubscriptions = await Subscription.count({
        where: { 
          app_id: application.id,
          status: ['trial', 'active']
        }
      });
      
      if (activeSubscriptions > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete application with active subscriptions'
        });
      }
      
      await application.destroy();
      
      res.json({
        success: true,
        message: 'Application deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async getTariffs(req, res, next) {
    try {
      const Application = req.db.getModel('Application');
      const Tariff = req.db.getModel('Tariff');
      
      const application = await Application.findByPk(req.params.id);
      
      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Application not found'
        });
      }
      
      const tariffs = await Tariff.findAll({
        where: { app_id: application.id },
        order: [['sort_order', 'ASC'], ['price', 'ASC']]
      });
      
      const result = tariffs.map(tariff => 
        TariffDTO.fromSequelize(tariff).toApiResponse()
      );
      
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ApplicationController();