class PaymentDTO {
    constructor(data) {
      this.id = data.id;
      this.portalId = data.portal_id || data.portalId;
      this.externalId = data.external_id || data.externalId;
      this.amount = parseFloat(data.amount || 0);
      this.status = data.status || 'pending';
      this.paymentMethod = data.payment_method || data.paymentMethod;
      this.description = data.description;
      this.metadata = data.metadata || {};
      this.createdAt = data.created_at || data.createdAt;
      this.updatedAt = data.updated_at || data.updatedAt;
      
      if (data.portal) {
        const PortalDTO = require('./PortalDTO');
        this.portal = new PortalDTO(data.portal);
      }
    }
  
    toJSON() {
      return {
        id: this.id,
        portal_id: this.portalId,
        external_id: this.externalId,
        amount: this.amount,
        status: this.status,
        payment_method: this.paymentMethod,
        description: this.description,
        metadata: this.metadata,
        created_at: this.createdAt,
        updated_at: this.updatedAt,
        portal: this.portal ? this.portal.toJSON() : null
      };
    }
  
    toApiResponse() {
      return {
        id: this.id,
        portalId: this.portalId,
        externalId: this.externalId,
        amount: this.amount,
        status: this.status,
        paymentMethod: this.paymentMethod,
        description: this.description,
        metadata: this.metadata,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
        portal: this.portal ? this.portal.toApiResponse() : null
      };
    }
  
    static fromSequelize(payment) {
      if (!payment) return null;
      return new PaymentDTO(payment.get({ plain: true }));
    }
  }
  
  module.exports = PaymentDTO;