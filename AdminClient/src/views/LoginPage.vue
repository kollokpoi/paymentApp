<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-header">
        <h1>Вход в систему</h1>
        <p>Введите ваши учетные данные</p>
      </div>

      <form @submit.prevent="handleSubmit" class="login-form">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            placeholder="admin@example.com"
            required
            :disabled="authStore.isLoading"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="password">Пароль</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            placeholder="password"
            required
            :disabled="authStore.isLoading"
            class="form-input"
          />
        </div>

        <div v-if="authStore.error" class="error-message">
          {{ authStore.error }}
        </div>

        <button
          type="submit"
          :disabled="authStore.isLoading || !formValid"
          class="submit-button"
        >
          <span v-if="authStore.isLoading" class="loading-spinner"></span>
          <span v-else>Войти</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import {reactive, computed , onMounted} from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const form = reactive({
  email: '',
  password: ''
})
onMounted(()=>{
  console.log('Router object:', router)
  console.log('Router methods:', Object.keys(router))
  console.log('Current route before:', router.currentRoute.value)
})
const formValid = computed(() => {
  return form.email.trim() !== '' && form.password.trim() !== ''
})

const handleSubmit = async () => {
  const result = await authStore.login(form)

  if (result.success) {
    const redirectPath = route.query.redirect as string
    router.push(redirectPath || '/')
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-container {
  width: 100%;
  max-width: 400px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.login-header {
  padding: 40px 40px 20px;
  text-align: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.login-header h1 {
  margin: 0 0 10px;
  font-size: 28px;
}

.login-header p {
  margin: 0;
  opacity: 0.9;
}

.login-form {
  padding: 40px;
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
}

.form-input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.error-message {
  margin: 16px 0;
  padding: 12px;
  background-color: #fee;
  color: #c33;
  border-radius: 8px;
  font-size: 14px;
}

.submit-button {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
}

.submit-button:hover:not(:disabled) {
  opacity: 0.9;
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.demo-credentials {
  margin-top: 30px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
  font-size: 14px;
  color: #666;
  text-align: center;
}

.demo-credentials p {
  margin: 5px 0;
}

.demo-credentials strong {
  color: #333;
}
</style>
