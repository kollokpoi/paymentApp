<template>
    <div class="profile">
      <header class="header">
        <h1>Профиль пользователя</h1>
        <div>
          <router-link to="/dashboard" class="btn">
            ← Назад
          </router-link>
          <button @click="handleLogout" class="logout-btn">
            Выйти
          </button>
        </div>
      </header>
      
      <div class="profile-card">
        <h2>Информация о пользователе</h2>
        <div class="info">
          <p><strong>Имя:</strong> {{ authStore.user?.name }}</p>
          <p><strong>Email:</strong> {{ authStore.user?.email }}</p>
          <p><strong>ID:</strong> {{ authStore.user?.id }}</p>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '../stores/auth'
  
  const router = useRouter()
  const authStore = useAuthStore()
  
  const handleLogout = () => {
    authStore.logout()
    router.push('/')
  }
  </script>
  
  <style scoped>
  .profile {
    padding: 2rem;
    max-width: 800px;
    margin: 0 auto;
  }
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #ddd;
  }
  
  .btn {
    display: inline-block;
    padding: 0.5rem 1rem;
    background: #42b883;
    color: white;
    text-decoration: none;
    border-radius: 4px;
    margin-right: 1rem;
  }
  
  .logout-btn {
    padding: 0.5rem 1rem;
    background: #ff6b6b;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .profile-card {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  }
  
  .info {
    margin-top: 1rem;
  }
  
  .info p {
    margin: 0.5rem 0;
    padding: 0.5rem;
    background: #f9f9f9;
    border-radius: 4px;
  }
  </style>