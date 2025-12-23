<template>
    <div class="login">
      <div class="login-card">
        <h2>Вход в систему</h2>
        
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label for="email">Email</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              required
              :disabled="authStore.isLoading"
            >
          </div>
          
          <div class="form-group">
            <label for="password">Пароль</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              required
              :disabled="authStore.isLoading"
            >
          </div>
          
          <div v-if="authStore.error" class="error">
            {{ authStore.error }}
          </div>
          
          <button 
            type="submit" 
            :disabled="authStore.isLoading"
            class="btn"
          >
            <span v-if="authStore.isLoading">Вход...</span>
            <span v-else>Войти</span>
          </button>
        </form>
        
        <router-link to="/" class="back-link">
          ← На главную
        </router-link>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { reactive } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '@/stores/auth'
  
  const router = useRouter()
  const authStore = useAuthStore()
  
  const form = reactive({
    email: '',
    password: ''
  })
  
  const handleSubmit = async () => {
    const result = await authStore.login(form)
    
    if (result.success) {
      const redirect = router.currentRoute.value.query.redirect as string
      router.push(redirect || '/dashboard')
    }
  }
  </script>
  
  <style scoped>
  .login {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: 1rem;
  }
  
  .login-card {
    width: 100%;
    max-width: 400px;
    padding: 2rem;
    border: 1px solid #ddd;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  }
  
  .form-group {
    margin-bottom: 1rem;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
  }
  
  .form-group input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
  }
  
  .error {
    margin: 1rem 0;
    padding: 0.5rem;
    background: #fee;
    color: #c33;
    border-radius: 4px;
  }
  
  .btn {
    width: 100%;
    padding: 0.75rem;
    background: #42b883;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
  }
  
  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .back-link {
    display: inline-block;
    margin-top: 1rem;
    color: #666;
    text-decoration: none;
  }
  </style>