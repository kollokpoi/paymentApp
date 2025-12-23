<template>
    <div class="dashboard">
      <header class="header">
        <h1>Панель управления</h1>
        <button @click="handleLogout" class="logout-btn">
          Выйти
        </button>
      </header>
      
      <nav class="nav">
        <router-link to="/profile">Профиль</router-link>
        <router-link to="/">Главная</router-link>
      </nav>
      
      <main class="content">
        <p>Добро пожаловать, {{ authStore.user?.name }}!</p>
        <p>Ваш email: {{ authStore.user?.email }}</p>
      </main>
    </div>
  </template>
  
  <script setup lang="ts">
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '@/stores/auth'
  
  const router = useRouter()
  const authStore = useAuthStore()
  
  const handleLogout = () => {
    authStore.logout()
    router.push('/')
  }
  </script>
  
  <style scoped>
  .dashboard {
    padding: 2rem;
  }
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #ddd;
  }
  
  .logout-btn {
    padding: 0.5rem 1rem;
    background: #ff6b6b;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .nav {
    margin-bottom: 2rem;
  }
  
  .nav a {
    margin-right: 1rem;
    padding: 0.5rem 1rem;
    background: #f0f0f0;
    color: #333;
    text-decoration: none;
    border-radius: 4px;
  }
  
  .nav a:hover {
    background: #e0e0e0;
  }
  
  .content {
    background: #f9f9f9;
    padding: 2rem;
    border-radius: 8px;
  }
  </style>