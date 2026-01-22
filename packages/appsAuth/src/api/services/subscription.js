export class SubscriptionService {
  constructor(apiClient) {
    this.api = apiClient;
  }

  async getCurrent() {
    const response = await this.api.get('/api/subscription/');
    return response;
  }

  async getById(subscriptionId) {
    const response = await this.api.get(`/api/subscriptions/${subscriptionId}`);
    return response;
  }

  async getAll(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/api/subscriptions?${query}` : '/api/subscriptions';
    const response = await this.api.get(endpoint);
    return response;
  }

  async create(data) {
    const response = await this.api.post('/api/subscriptions', data);
    return response;
  }

  async extend(subscriptionId, data) {
    const response = await this.api.post(`/api/subscriptions/${subscriptionId}/extend`, data);
    return response;
  }

  async cancel(subscriptionId) {
    const response = await this.api.post(`/api/subscriptions/${subscriptionId}/cancel`);
    return response;
  }
}