const { ApplicationDTO, TariffDTO } = require('@payment-app/apiModels')

class ApplicationController {
  async get (req, res, next) {
    const { id } = req.params

    try {
      const Application = req.db.getModel('Application')
      const application = await Application.findByPk(id,{
        attributes:['id','name','description']
      })

      if (!application) {
        return res.json({
          success: false,
          message: 'Application not found'
        })
      }
      const result = ApplicationDTO.fromSequelize(application).toApiResponse()

      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      next(error)
    }
  }
  async getTariffs (req, res, next) {
    const { appId } = req.params

    try {
      const Tariff = req.db.getModel('Tariff')
      const appTariffs = await Tariff.scope({
        method: ['forApp', appId]
      }).findAll()

      const result = appTariffs.map(tariff =>
        TariffDTO.fromSequelize(tariff).toApiResponse()
      )

      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      next(error)
    }
  }
  async getData (req, res, next) {}
}

module.exports = new ApplicationController()
