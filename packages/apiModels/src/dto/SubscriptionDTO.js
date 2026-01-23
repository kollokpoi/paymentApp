class SubscriptionDTO {
    constructor(data) {
      this.id = data.id;
      this.portalId = data.portal_id || data.portalId;
      this.appId = data.app_id || data.appId;
      this.tariffId = data.tariff_id || data.tariffId;
      this.status = data.status || 'trial';
      this.validFrom = data.valid_from || data.validFrom;
      this.validUntil = data.valid_until || data.validUntil;
      this.autoRenew = data.auto_renew !== undefined ? data.auto_renew : data.autoRenew;
      this.trialEndDate = data.trial_end_date || data.trialEndDate;
      this.createdAt = data.created_at || data.createdAt;
      this.updatedAt = data.updated_at || data.updatedAt;
      this.notes = data.notes
      this.usedLimits = data.used_limits || data.usedLimits || {}
      this.metadata = data.metadata || {}

      if (data.application) {
        const ApplicationDTO = require('./ApplicationDTO');
        this.application = new ApplicationDTO(data.application);
      }
      
      if (data.tariff) {
        const TariffDTO = require('./TariffDTO');
        this.tariff = new TariffDTO(data.tariff);
      }

      if(data.portal){
        const PortalDTO = require('./PortalDTO');
        this.portal = new PortalDTO(data.portal);
      }
    }
  
    toJSON() {
      return {
        id: this.id,
        portal_id: this.portalId,
        app_id: this.appId,
        tariff_id: this.tariffId,
        status: this.status,
        valid_from: this.validFrom,
        valid_until: this.validUntil,
        auto_renew: this.autoRenew,
        trial_end_date: this.trialEndDate,
        created_at: this.createdAt,
        updated_at: this.updatedAt,
        notes: this.notes,
        used_limits: this.usedLimits || {},
        metadata: this.metadata,
        application: this.application ? this.application.toJSON() : null,
        tariff: this.tariff ? this.tariff.toJSON() : null,
        portal: this.portal? this.portal.toJSON() : null
      };
    }
  
    toApiResponse() {
      return {
        id: this.id,
        portalId: this.portalId,
        appId: this.appId,
        tariffId: this.tariffId,
        status: this.status,
        validFrom: this.validFrom,
        validUntil: this.validUntil,
        autoRenew: this.autoRenew,
        trialEndDate: this.trialEndDate,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
        notes:this.notes,
        usedLimits:this.usedLimits,
        metadata:this.metadata,
        application: this.application ? this.application.toApiResponse() : null,
        tariff: this.tariff ? this.tariff.toApiResponse() : null,
        portal: this.portal ? this.portal.toApiResponse() : null
      };
    }
  
    get isActive() {
      return ['trial', 'active'].includes(this.status) && 
             new Date(this.validUntil) > new Date();
    }
  
    get daysLeft() {
      const now = new Date();
      const until = new Date(this.validUntil);
      const diff = until - now;
      return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }
  
    static fromSequelize(subscription) {
      if (!subscription) return null;
      
      const data = subscription.get({ plain: true });
      return new SubscriptionDTO(data);
    }
  }
  
  module.exports = SubscriptionDTO;