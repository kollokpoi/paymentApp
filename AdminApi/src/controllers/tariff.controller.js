const { TariffDTO } = require("@payment-app/apiModels");

class TariffController {
  async getAll(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        appId,
        isActive,
        period,
        priceFrom,
        priceTo,
        hasTrial,
        isDefault
      } = req.query;

      const offset = (page - 1) * limit;

      const Tariff = req.db.getModel('Tariff');
      const where = {};

      // Базовые фильтры
      if (appId) where.app_id = appId;
      if (isActive !== undefined) where.is_active = isActive === 'true';
      if (period) where.period = period;
      if (isDefault !== undefined) where.is_default = isDefault === 'true';

      // Фильтр по цене
      if (priceFrom || priceTo) {
        where.price = {};
        if (priceFrom) where.price[Op.gte] = parseFloat(priceFrom);
        if (priceTo) where.price[Op.lte] = parseFloat(priceTo);
      }

      // Фильтр по пробному периоду
      if (hasTrial !== undefined) {
        if (hasTrial === 'true') {
          where.trial_days = { [Op.gt]: 0 };
        } else {
          where.trial_days = { [Op.eq]: 0 };
        }
      }

      // Поиск по названию, коду, описанию
      if (search) {
        where[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { code: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } }
        ];
      }

      const include = [{
        model: req.db.getModel('Application'),
        as: 'application',
        attributes: ['id', 'name']
      }];

      const { count, rows } = await Tariff.findAndCountAll({
        where,
        include,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['sort_order', 'ASC'], ['name', 'ASC']]
      });

      const tariffs = rows.map(tariff =>
        TariffDTO.fromSequelize(tariff).toApiResponse()
      );

      res.json({
        success: true,
        data: {
          items: tariffs,
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit),
          hasNext: parseInt(page) < Math.ceil(count / limit),
          hasPrev: parseInt(page) > 1
        }
      });
    } catch (error) {
      next(error);
    }
  }
  async getById(req, res, next) {
    try {
      const Tariff = req.db.getModel("Tariff");
      const tariff = await Tariff.findByPk(req.params.id, {
        include: ["application"],
      });

      if (!tariff) {
        return res.status(404).json({
          success: false,
          message: "Tariff not found",
        });
      }

      const tariffDTO = TariffDTO.fromSequelize(tariff);
      res.json({ success: true, data: tariffDTO.toApiResponse() });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const Tariff = req.db.getModel("Tariff");
      const Application = req.db.getModel("Application");

      const {
        app_id,
        code,
        name,
        description,
        price,
        period,
        trial_days,
        is_active,
        is_default,
        limits,
        features,
        sort_order,
      } = req.body;

      if (!app_id || !code || !name || price === undefined) {
        return res.status(400).json({
          success: false,
          message: "app_id, code, name and price are required",
        });
      }

      const application = await Application.findByPk(app_id);
      if (!application) {
        return res.status(404).json({
          success: false,
          message: "Application not found",
        });
      }

      const existing = await Tariff.findOne({
        where: { app_id, code },
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Tariff with this code already exists for this application",
        });
      }
      let makeDefault = false;
      if (is_default) {
        await Tariff.update({ is_default: false }, { where: { app_id } });
      }
      else {
        makeDefault = await Tariff.count({
          where: {
            is_default: true,
            app_id
          }
        }) === 0;
      }

      const tariff = await Tariff.create({
        app_id,
        code,
        name,
        description,
        price: parseFloat(price),
        period: period || "month",
        trial_days: trial_days || 0,
        is_active: is_active !== undefined ? is_active : true,
        is_default: makeDefault ? true : is_default || false,
        limits: limits || {},
        features: features || [],
        sort_order: sort_order || 0,
      });

      const tariffDTO = TariffDTO.fromSequelize(tariff);

      res.status(201).json({
        success: true,
        data: tariffDTO.toApiResponse(),
        message: "Tariff created successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const Tariff = req.db.getModel("Tariff");
      const tariff = await Tariff.findByPk(req.params.id);

      if (!tariff) {
        return res.status(404).json({
          success: false,
          message: "Tariff not found",
        });
      }

      const {
        name,
        description,
        price,
        period,
        trial_days,
        is_active,
        is_default,
        limits,
        features,
        sort_order,
      } = req.body;

      if (is_default && !tariff.is_default) {

        await Tariff.update(
          { is_default: false },
          { where: { app_id: tariff.app_id } }
        );
      }

      await tariff.update({
        name,
        description,
        price: price !== undefined ? parseFloat(price) : tariff.price,
        period,
        trial_days,
        is_active,
        limits,
        features: features || tariff.features,
        sort_order,
      });

      const tariffDTO = TariffDTO.fromSequelize(tariff);
      res.json({
        success: true,
        data: tariffDTO.toApiResponse(),
        message: "Tariff updated successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const Tariff = req.db.getModel("Tariff");
      const Subscription = req.db.getModel("Subscription");

      const tariff = await Tariff.findByPk(req.params.id);

      if (!tariff) {
        return res.status(404).json({
          success: false,
          message: "Tariff not found",
        });
      }

      const activeSubscriptions = await Subscription.count({
        where: {
          tariff_id: tariff.id,
          status: ["trial", "active"],
        },
      });

      if (activeSubscriptions > 0) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete tariff with active subscriptions",
        });
      }

      if (tariff.is_default) {
        const otherTariff = await Tariff.findOne({
          where: {
            app_id: tariff.app_id,
            id: { [req.db.sequelize.Op.ne]: tariff.id },
            is_active: true,
          },
          order: [["sort_order", "ASC"]],
        });

        if (otherTariff) {
          await otherTariff.update({ is_default: true });
        }
      }

      await tariff.destroy();

      res.json({
        success: true,
        message: "Tariff deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async getActiveCount(req, res, next) {
    try {
      const Tariff = req.db.getModel("Tariff");
      const count = await Tariff.count({
        where: {
          is_active: true,
        },
      });

      res.json({
        success: true,
        data: count
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TariffController();
