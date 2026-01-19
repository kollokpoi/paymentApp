class ApplicationDTO {
    constructor(data) {
      this.id = data.id;
      this.name = data.name;
      this.description = data.description;
      this.version = data.version;
      this.isActive = data.is_active !== undefined ? data.is_active : data.isActive;
      this.iconUrl = data.icon_url || data.iconUrl;
      this.settings = data.settings || {};
      this.sortOrder = data.sort_order || data.sortOrder || 0;
      this.createdAt = data.created_at || data.createdAt;
      this.updatedAt = data.updated_at || data.updatedAt;
      this.clientId = data.clientId || data.client_id
      this.clientSecret = data.clientSecret || data.client_secret
    }
  
    toJSON() {
      return {
        id: this.id,
        name: this.name,
        description: this.description,
        version: this.version,
        is_active: this.isActive,
        icon_url: this.iconUrl,
        settings: this.settings,
        sort_order: this.sortOrder,
        created_at: this.createdAt,
        updated_at: this.updatedAt,
        client_secret:this.clientSecret
      };
    }
  
    toApiResponse() {
      return {
        id: this.id,
        name: this.name,
        description: this.description,
        version: this.version,
        isActive: this.isActive,
        iconUrl: this.iconUrl,
        settings: this.settings,
        sortOrder: this.sortOrder,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
        clientSecret: this.clientSecret
      };
    }
  
    static fromSequelize(app) {
      if (!app) return null;
      return new ApplicationDTO(app.get({ plain: true }));
    }
  }
  
  module.exports = ApplicationDTO;