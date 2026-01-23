<template>
  <div>
    <Header/>
    <div v-if="authStore.isLoading">Загрузка...</div>

    <div v-else-if="authStore.isAuthenticated" class="dashboard">
      <h1>Личный кабинет</h1>

      <div class="user-info">
        <h3>Информация о подписке</h3>
        <p><strong>Домен:</strong> {{ authStore.domain }}</p>
        <p><strong>Тариф:</strong> {{ authStore.currentTariff?.name }}</p>
        <p><strong>Статус:</strong> {{ subscriptionStatus }}</p>
        <p><strong>Дней осталось:</strong> {{ authStore.daysLeft }}</p>
        <pre>
            {{ authStore.currentTariff }}
        </pre>
      </div>

      <div class="actions">
        <button @click="refreshData" class="btn-refresh">
          Обновить данные
        </button>
        <button @click="authStore.logout()" class="btn-logout">
          Выйти
        </button>
      </div>

      <!-- Работа с API -->
      <div class="api-section">
        <h3>Работа с API</h3>
        <button @click="getPortals">Получить порталы</button>
        <button @click="getSubscriptionInfo">Получить подписку</button>
      </div>
    </div>

    <div v-else class="not-authorized">
      <h3>Требуется авторизация</h3>
      <button @click="login" class="btn-login">
        Войти в систему
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useAuthStore } from '@payment-app/authSdk';
import Header from '@/components/header.vue';

// Используем ТО ЖЕ САМОЕ хранилище, что и в App.vue
const authStore = useAuthStore();

// Computed свойства
const subscriptionStatus = computed(() => {
  if (!authStore.subscription) return 'Нет подписки';

  const statusMap = {
    active: 'Активна',
    trial: 'Пробный период',
    expired: 'Истекла',
    suspended: 'Приостановлена'
  };

  return statusMap[authStore.subscription.status] || authStore.subscription.status;
});

// Методы
const login = async () => {
  const result = await authStore.login();
  if (result.success) {
    console.log('Успешный вход!');
  }
};

const refreshData = async () => {
  // Здесь можно добавить логику обновления данных
  console.log('Обновляем данные...');
};

const getPortals = async () => {
  try {
    // Через хранилище можно получить доступ к API
    const response = await authStore.$api?.portals?.getAll();
    console.log('Порталы:', response);
  } catch (error) {
    console.error('Ошибка получения порталов:', error);
  }
};

const getSubscriptionInfo = async () => {
  if (authStore.subscription?.id) {
    try {
      const response = await authStore.$api?.subscriptions?.getById(
        authStore.subscription.id
      );
      console.log('Детали подписки:', response);
    } catch (error) {
      console.error('Ошибка получения подписки:', error);
    }
  }
};


</script>

<style scoped>
.dashboard {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.user-info {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.actions {
  display: flex;
  gap: 10px;
  margin: 20px 0;
}

button {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.btn-login {
  background: #3498db;
  color: white;
}

.btn-logout {
  background: #e74c3c;
  color: white;
}

.btn-refresh {
  background: #2ecc71;
  color: white;
}

.api-section {
  margin-top: 30px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.not-authorized {
  padding: 40px;
  text-align: center;
  color: #666;
}
</style>