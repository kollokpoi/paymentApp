<template>
  <div class="forbidden-page">
    <div class="container">
      <div class="error-code">403</div>
      <h1>Доступ запрещен</h1>
      
      <div class="message">
        <p>
          У вашего текущего тарифа нет доступа к этой странице.
        </p>
      </div>
      
      <div class="current-plan" v-if="authStore.currentTariff">
        <h3>Ваш текущий тариф:</h3>
        <div class="plan-card">
          <div class="plan-name">{{ authStore.currentTariff.name }}</div>
          <div class="plan-price">{{ authStore.currentTariff.price }}/месяц</div>
          
          <div class="available-pages">
            <h4>Доступные страницы:</h4>
            <ul>
              <li v-for="page in authStore.availablePages" :key="page">
                {{ getPageTitle(page) }}
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      <div class="actions">
        <router-link to="/tariffs" class="upgrade-btn">
          📈 Обновить тариф
        </router-link>
        
        <router-link 
          v-for="page in authStore.availablePages" 
          :key="page"
          :to="{ name: page }"
          class="available-page-btn"
        >
          {{ getPageTitle(page) }}
        </router-link>
        
        <button @click="goBack" class="back-btn">
          ↩️ Назад
        </button>
      </div>
      
      <div class="support">
        <p>Нужна помощь? <a href="mailto:support@example.com">Свяжитесь с поддержкой</a></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@payment-app/authSdk';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const getPageTitle = (pageName) => {
  const titles = {
    dashboard: 'Дашборд',
    subscription: 'Подписка',
    payment: 'Оплата',
    settings: 'Настройки',
    admin: 'Админ-панель',
    analytics: 'Аналитика',
    reports: 'Отчеты'
  };
  return titles[pageName] || pageName;
};

const goBack = () => {
  router.go(-1);
};
</script>

<style scoped>
.forbidden-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
}

.container {
  max-width: 800px;
  background: white;
  border-radius: 15px;
  padding: 40px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.error-code {
  font-size: 120px;
  font-weight: bold;
  color: #ff6b6b;
  line-height: 1;
  margin-bottom: 20px;
}

h1 {
  color: #333;
  margin-bottom: 20px;
}

.message {
  font-size: 18px;
  color: #666;
  margin-bottom: 40px;
  line-height: 1.6;
}

.current-plan {
  margin: 40px 0;
  padding: 25px;
  background: #f8f9fa;
  border-radius: 10px;
  border-left: 4px solid #667eea;
}

.plan-card {
  text-align: left;
}

.plan-name {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.plan-price {
  font-size: 18px;
  color: #666;
  margin-bottom: 20px;
}

.available-pages h4 {
  margin-bottom: 10px;
  color: #333;
}

.available-pages ul {
  list-style: none;
  padding: 0;
}

.available-pages li {
  padding: 8px 0;
  border-bottom: 1px solid #eee;
  color: #555;
}

.available-pages li:last-child {
  border-bottom: none;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  justify-content: center;
  margin: 40px 0;
}

.upgrade-btn, .available-page-btn, .back-btn {
  padding: 15px 25px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s;
  border: none;
  cursor: pointer;
  font-size: 16px;
}

.upgrade-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  flex: 1;
  max-width: 300px;
}

.available-page-btn {
  background: #e9ecef;
  color: #495057;
}

.back-btn {
  background: #6c757d;
  color: white;
}

.upgrade-btn:hover, .available-page-btn:hover, .back-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.support {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eee;
  color: #666;
}

.support a {
  color: #667eea;
  text-decoration: none;
}
</style>