<template>
  <slot v-if="isReady" />

  <!-- Глобальный лоадер -->
  <div v-else class="auth-provider">
    <div class="auth-loader">
      <div class="spinner"></div>
      <div class="steps">
        <div class="step" :class="{ active: currentStep === 1 }">
          <div class="step-number">1</div>
          <div class="step-text">Определение домена...</div>
        </div>
        <div class="step" :class="{ active: currentStep === 2 }">
          <div class="step-number">2</div>
          <div class="step-text">Проверка авторизации...</div>
        </div>
        <div class="step" :class="{ active: currentStep === 3 }">
          <div class="step-number">3</div>
          <div class="step-text">Загрузка данных...</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, provide } from 'vue';
import { useRouter } from 'vue-router';
import { B24AuthSDK, useAuthStore } from '@payment-app/authSdk';

const router = useRouter();
const authStore = useAuthStore();

const isReady = ref(false);
const currentStep = ref(1);
const sdk = ref(null);
const error = ref(null);

// Шаги инициализации

// 1. Инициализация SDK
const initSDK = async () => {
  try {
    currentStep.value = 1;
    sdk.value = new B24AuthSDK({
      baseURL: import.meta.env.VITE_API_URL,
      appId: import.meta.env.VITE_APP_ID
    });

    await sdk.value.determineDomain();
    console.log('✅ SDK инициализирован, домен:', sdk.value.domain);
  } catch (err) {
    throw new Error(`Ошибка инициализации SDK: ${err.message}`);
  }
};

// 2. Проверка авторизации
const checkAuth = async () => {
  try {
    currentStep.value = 2;

    // Создаем или получаем store
    const store = await sdk.value.createStore();

    // Если нет токенов - логин
    if (!store.isAuthenticated) {
      console.log('🔐 Требуется авторизация...');
      const result = await store.login();

      if (!result.success) {
        throw new Error(result.message || 'Ошибка авторизации');
      }

      console.log('✅ Авторизация успешна');
    } else {
      console.log('✅ Уже авторизован');
    }
  } catch (err) {
    throw new Error(`Ошибка авторизации: ${err.message}`);
  }
};

// 3. Загрузка подписки
const loadSubscription = async () => {
  try {
    currentStep.value = 3;

    // Проверяем, есть ли подписка
    if (!authStore.subscription) {
      console.log('📦 Загружаем данные подписки...');
      await authStore.refreshSubscription();
    }

    console.log('✅ Данные загружены');
  } catch (err) {
    console.warn('Не удалось загрузить подписку:', err);
    // Не прерываем инициализацию, даже если подписка не загрузилась
  }
};

// Главная функция инициализации
const initializeApp = async () => {
  try {
    console.log('🚀 Начало инициализации приложения...');

    // Выполняем все шаги
    for (const step of steps) {
      await step.action();
    }

    // Готово
    isReady.value = true;
    console.log('🎉 Приложение готово к работе!');

    // Пробрасываем SDK вниз по дереву компонентов
    provide('sdk', sdk.value);

  } catch (err) {
    console.error('❌ Ошибка инициализации:', err);
    error.value = err.message;

    // Перенаправляем на страницу ошибки
    router.push({
      name: 'auth-error',
      query: { error: err.message }
    });
  }
};

const steps = [
  { id: 1, title: 'Определение домена', action: initSDK },
  { id: 2, title: 'Проверка авторизации', action: checkAuth },
  { id: 3, title: 'Загрузка данных', action: loadSubscription }
];

// Запускаем при монтировании
onMounted(() => {
  initializeApp();
});

// Экспортируем методы для использования в дочерних компонентах
defineExpose({
  sdk,
  refresh: initializeApp,
  logout: async () => {
    if (sdk.value) {
      await authStore.logout();
      router.push('/login');
    }
  }
});
</script>

<style scoped>
.auth-provider {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  z-index: 9999;
}

.auth-loader {
  background: rgba(255, 255, 255, 0.9);
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  text-align: center;
  min-width: 400px;
}

.spinner {
  width: 60px;
  height: 60px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 30px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.steps {
  margin-top: 20px;
}

.step {
  display: flex;
  align-items: center;
  margin: 15px 0;
  opacity: 0.5;
  transition: all 0.3s;
}

.step.active {
  opacity: 1;
}

.step.completed .step-number {
  background: #4CAF50;
  color: white;
}

.step-number {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-weight: bold;
  font-size: 14px;
  transition: all 0.3s;
}

.step.active .step-number {
  background: #667eea;
  color: white;
}

.step-text {
  font-size: 16px;
  color: #333;
}
</style>