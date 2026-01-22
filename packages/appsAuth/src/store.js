import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useAuthStore = defineStore('auth', () => {
  // State
  const accessToken = ref(null);
  const refreshToken = ref(null);
  const subscription = ref(null);
  const currentTariff = ref(null);
  const domain = ref(null);
  const isLoading = ref(false);
  const error = ref(null);

  // Computed
  const isAuthenticated = computed(() => {
    return !!accessToken.value && !!subscription.value;
  });

  const isSubscriptionActive = computed(() => {
    if (!subscription.value) return false;
    const status = subscription.value.status;
    const validUntil = new Date(subscription.value.valid_until);
    const now = new Date();
    return (status === 'active' || status === 'trial') && validUntil > now;
  });

  const daysLeft = computed(() => {
    if (!subscription.value?.valid_until) return 0;
    const now = new Date();
    const until = new Date(subscription.value.valid_until);
    const diff = until - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  });

  // Actions
  async function initialize(api, config) {
    isLoading.value = true;
    error.value = null;

    try {
      // Определяем домен
      if (typeof BX24 !== 'undefined') {
        try {
          domain.value = BX24.getDomain();
        } catch (error) {
          console.warn('Cannot get domain from BX24:', error);
        }
      }

      if (!domain.value) {
        const url = new URL(window.location.href);
        const params = new URLSearchParams(url.search);
        if (params.has('DOMAIN')) {
          domain.value = params.get('DOMAIN');
        } else if (document.referrer) {
          try {
            const referrerUrl = new URL(document.referrer);
            domain.value = referrerUrl.hostname;
          } catch (e) {
            domain.value = window.location.hostname;
          }
        }
      }

      // Загружаем сохраненные токены
      loadTokens();

      // Если есть токены, загружаем подписку
      if (accessToken.value && refreshToken.value) {
        api.setTokens(accessToken.value, refreshToken.value);
        await loadSubscriptionAndTariff(api);
      }
    } catch (err) {
      console.error('Auth initialization failed:', err);
      error.value = err.message;
    } finally {
      isLoading.value = false;
    }
  }

  function loadTokens() {
    try {
      if (!domain.value) return;

      const storageKey = `b24app_${domain.value}`;
      const saved = localStorage.getItem(storageKey);

      if (saved) {
        const tokens = JSON.parse(saved);
        accessToken.value = tokens.accessToken;
        refreshToken.value = tokens.refreshToken;
      }
    } catch (err) {
      console.error('Failed to load tokens:', err);
    }
  }

  async function loadSubscriptionAndTariff(api) {
    try {
      const subscriptionResponse = await api.subscriptions.getCurrent();
      const tariffResponse = await api.tariffs.getCurrent();

      if (subscriptionResponse.success && subscriptionResponse.data) {
        subscription.value = subscriptionResponse.data;
      }
      if (tariffResponse.success && tariffResponse.data) {
        currentTariff.value = tariffResponse.data;
      }
    } catch (err) {
      console.error('Failed to load subscription:', err);
    }
  }

  async function login(api, appId) {
    isLoading.value = true;
    error.value = null;

    try {
      if (!domain.value || !appId) {
        throw new Error('Domain or App ID not available');
      }

      const loginResponse = await api.auth.login(domain.value, appId);

      if (loginResponse.success) {
        const { subscription: subData, tokens } = loginResponse.data;

        // Сохраняем токены
        saveTokens(tokens.accessToken, tokens.refreshToken);
        api.setTokens(tokens.accessToken, tokens.refreshToken);

        subscription.value = subData;
        currentTariff.value = subData.tariff;

        return { success: true, data: subData };
      }

      error.value = loginResponse.message;
      return { success: false, message: loginResponse.message };
    } catch (err) {
      console.error('Login failed:', err);
      error.value = err.message;
      return { success: false, message: err.message };
    } finally {
      isLoading.value = false;
    }
  }

  function saveTokens(access, refresh) {
    try {
      if (!domain.value) return;

      const storageKey = `b24app_${domain.value}`;
      const tokens = {
        accessToken: access,
        refreshToken: refresh,
        savedAt: Date.now(),
      };

      localStorage.setItem(storageKey, JSON.stringify(tokens));
      accessToken.value = access;
      refreshToken.value = refresh;
    } catch (err) {
      console.error('Failed to save tokens:', err);
    }
  }

  function logout(api) {
    try {
      if (refreshToken.value) {
        api.auth.logout(refreshToken.value);
      }
    } catch (err) {
      console.warn('Logout API call failed:', err);
    } finally {
      clearAuth(api);
    }
  }

  function clearAuth(api) {
    try {
      if (domain.value) {
        const storageKey = `b24app_${domain.value}`;
        localStorage.removeItem(storageKey);
      }

      accessToken.value = null;
      refreshToken.value = null;
      subscription.value = null;
      currentTariff.value = null;
      error.value = null;
      api.clearTokens();
    } catch (err) {
      console.error('Failed to clear auth:', err);
    }
  }

  return {
    // State
    accessToken,
    refreshToken,
    subscription,
    currentTariff,
    domain,
    isLoading,
    error,

    // Computed
    isAuthenticated,
    isSubscriptionActive,
    daysLeft,

    // Actions
    initialize,
    login,
    logout,
    clearAuth,
  };
});