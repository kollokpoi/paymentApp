class PaymentDTO {
    constructor(data) {
      this.id = data.id;
      this.subscriptionId = data.subscription_id || data.subscriptionId;
      this.externalId = data.external_id || data.externalId;
      this.amount = parseFloat(data.amount || 0);
      this.status = data.status || 'pending';
      this.paymentMethod = data.payment_method || data.paymentMethod;
      this.description = data.description;
      this.metadata = data.metadata || {};
      this.createdAt = data.created_at || data.createdAt;
      this.updatedAt = data.updated_at || data.updatedAt;
      
      if (data.subscription) {
        const SubscriptionDTO = require('./SubscriptionDTO');
        this.subscription = new SubscriptionDTO(data.subscription);
      }
    }
  
    toJSON() {
      return {
        id: this.id,
        subscription_id: this.subscriptionId,
        external_id: this.externalId,
        amount: this.amount,
        status: this.status,
        payment_method: this.paymentMethod,
        description: this.description,
        metadata: this.metadata,
        created_at: this.createdAt,
        updated_at: this.updatedAt,
        subscription: this.subscription ? this.subscription.toJSON() : null
      };
    }
  
    toApiResponse() {
      return {
        id: this.id,
        subscriptionId: this.subscriptionId,
        externalId: this.externalId,
        amount: this.amount,
        status: this.status,
        paymentMethod: this.paymentMethod,
        description: this.description,
        metadata: this.metadata,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
        subscription: this.subscription ? this.subscription.toApiResponse() : null
      };
    }
  
    static fromSequelize(payment) {
      if (!payment) return null;
      return new PaymentDTO(payment.get({ plain: true }));
    }
  }
  
  module.exports = PaymentDTO;