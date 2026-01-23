<template>
  <AuthProvider>
    <router-view />
  </AuthProvider>
</template>

<script setup>

import AuthProvider from '@/components/AuthProvider.vue';


</script>

<style>
.app-layout {
  min-height: 100vh;
}

main {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

main.with-header {
  padding-top: 80px;
}
</style>