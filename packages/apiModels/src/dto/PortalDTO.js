class PortalDTO {
    constructor(data) {
      this.id = data.id;
      this.b24Domain = data.b24_domain || data.b24Domain;
      this.companyName = data.company_name || data.companyName;
      this.adminEmail = data.admin_email || data.adminEmail;
      this.isActive = data.is_active !== undefined ? data.is_active : data.isActive;
      this.lastSyncAt = data.last_sync_at || data.lastSyncAt;
      this.createdAt = data.created_at || data.createdAt;
      this.updatedAt = data.updated_at || data.updatedAt;
      this.metadata = data.metadata || {};
      
      if (data.subscriptions) {
        const SubscriptionDTO = require('./SubscriptionDTO');
        this.subscriptions = Array.isArray(data.subscriptions) 
          ? data.subscriptions.map(sub => new SubscriptionDTO(sub))
          : [];
      }
    }
  
    toJSON() {
      return {
        id: this.id,
        b24_domain: this.b24Domain,
        company_name: this.companyName,
        admin_email: this.adminEmail,
        is_active: this.isActive,
        last_sync_at: this.lastSyncAt,
        created_at: this.createdAt,
        updated_at: this.updatedAt,
        metadata: this.metadata,
        subscriptions: this.subscriptions ? this.subscriptions.map(s => s.toJSON()) : []
      };
    }
  
    // Для API ответов (camelCase)
    toApiResponse() {
      return {
        id: this.id,
        b24Domain: this.b24Domain,
        companyName: this.companyName,
        adminEmail: this.adminEmail,
        isActive: this.isActive,
        lastSyncAt: this.lastSyncAt,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
        metadata: this.metadata,
        subscriptions: this.subscriptions ? this.subscriptions.map(s => s.toApiResponse()) : []
      };
    }
  
    static fromSequelize(portal, options = {}) {
      if (!portal) return null;
      
      const data = portal.get({ plain: true });
      return new PortalDTO(data);
    }
  }
  
  module.exports = PortalDTO;