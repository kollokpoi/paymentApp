class TariffDTO {
    constructor(data) {
      this.id = data.id;
      this.appId = data.app_id || data.appId;
      this.code = data.code;
      this.name = data.name;
      this.description = data.description;
      this.price = parseFloat(data.price || 0);
      this.period = data.period || 'month';
      this.trialDays = data.trial_days || data.trialDays || 0;
      this.isActive = data.is_active !== undefined ? data.is_active : data.isActive;
      this.isDefault = data.is_default !== undefined ? data.is_default : data.isDefault;
      this.limits = data.limits || {};
      this.features = data.features || [];
      this.sortOrder = data.sort_order || data.sortOrder || 0;
      this.createdAt = data.created_at || data.createdAt;
      this.updatedAt = data.updated_at || data.updatedAt;
      
      if (data.application) {
        const ApplicationDTO = require('./ApplicationDTO');
        this.application = new ApplicationDTO(data.application);
      }
    }
  
    toJSON() {
      return {
        id: this.id,
        app_id: this.appId,
        code: this.code,
        name: this.name,
        description: this.description,
        price: this.price,
        period: this.period,
        trial_days: this.trialDays,
        is_active: this.isActive,
        is_default: this.isDefault,
        limits: this.limits,
        features: this.features,
        sort_order: this.sortOrder,
        created_at: this.createdAt,
        updated_at: this.updatedAt,
        application: this.application ? this.application.toJSON() : null
      };
    }
  
    toApiResponse() {
      return {
        id: this.id,
        appId: this.appId,
        code: this.code,
        name: this.name,
        description: this.description,
        price: this.price,
        period: this.period,
        trialDays: this.trialDays,
        isActive: this.isActive,
        isDefault: this.isDefault,
        limits: this.limits,
        features: this.features,
        sortOrder: this.sortOrder,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
        application: this.application ? this.application.toApiResponse() : null
      };
    }
  
    static fromSequelize(tariff) {
      if (!tariff) return null;
      return new TariffDTO(tariff.get({ plain: true }));
    }
  }
  
  module.exports = TariffDTO;