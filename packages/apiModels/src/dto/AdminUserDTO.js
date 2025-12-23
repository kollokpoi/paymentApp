class AdminUserDTO {
    constructor(data) {
      this.id = data.id;
      this.email = data.email;
      this.name = data.name;
      this.role = data.role || 'admin';
      this.isActive = data.is_active !== undefined ? data.is_active : data.isActive;
      this.lastLogin = data.last_login || data.lastLogin;
      this.createdAt = data.created_at || data.createdAt;
      this.updatedAt = data.updated_at || data.updatedAt;
    }
  
    toJSON() {
      return {
        id: this.id,
        email: this.email,
        name: this.name,
        role: this.role,
        is_active: this.isActive,
        last_login: this.lastLogin,
        created_at: this.createdAt,
        updated_at: this.updatedAt
      };
    }
  
    toApiResponse() {
      return {
        id: this.id,
        email: this.email,
        name: this.name,
        role: this.role,
        isActive: this.isActive,
        lastLogin: this.lastLogin,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
      };
    }
  
    static fromSequelize(user) {
      if (!user) return null;
      return new AdminUserDTO(user.get({ plain: true }));
    }
  }
  
  module.exports = AdminUserDTO;