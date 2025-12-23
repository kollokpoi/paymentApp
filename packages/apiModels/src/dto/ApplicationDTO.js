class ApplicationDTO {
    constructor(data) {
      this.id = data.id;
      this.code = data.code;
      this.name = data.name;
      this.description = data.description;
      this.version = data.version;
      this.isActive = data.is_active !== undefined ? data.is_active : data.isActive;
      this.iconUrl = data.icon_url || data.iconUrl;
      this.settings = data.settings || {};
      this.sortOrder = data.sort_order || data.sortOrder || 0;
      this.createdAt = data.created_at || data.createdAt;
      this.updatedAt = data.updated_at || data.updatedAt;
    }
  
    toJSON() {
      return {
        id: this.id,
        code: this.code,
        name: this.name,
        description: this.description,
        version: this.version,
        is_active: this.isActive,
        icon_url: this.iconUrl,
        settings: this.settings,
        sort_order: this.sortOrder,
        created_at: this.createdAt,
        updated_at: this.updatedAt
      };
    }
  
    toApiResponse() {
      return {
        id: this.id,
        code: this.code,
        name: this.name,
        description: this.description,
        version: this.version,
        isActive: this.isActive,
        iconUrl: this.iconUrl,
        settings: this.settings,
        sortOrder: this.sortOrder,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
      };
    }
  
    static fromSequelize(app) {
      if (!app) return null;
      return new ApplicationDTO(app.get({ plain: true }));
    }
  }
  
  module.exports = ApplicationDTO;