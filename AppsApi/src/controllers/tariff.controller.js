const { TariffDTO } = require('@payment-app/apiModels')

class TariffController {
  async getCurrent (req, res, next) {
    if (!req.subscription) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      })
    }

    try {
      const subscription = req.subscription

      const Tariff = req.db.getModel('Tariff')
      const tariff = await Tariff.findByPk(subscription.tariff_id)
      if (!tariff) {
        return res.status(404).json({
          success: false,
          message: 'Tariff not found'
        })
      }

      const result = TariffDTO.fromSequelize(tariff).toApiResponse()
      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new TariffController()
