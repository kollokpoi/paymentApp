<template>
  <router-view v-slot="{ Component, route }">
    <component :is="route.meta.layout || 'div'">
      <component :is="Component" />
    </component>
  </router-view>
</template>


<script setup lang="ts">
import { watch , onMounted} from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

onMounted(() => {
  authStore.initialize()
})

watch(
  () => authStore.isAuthenticated,
  (isAuthenticated) => {
    if (!isAuthenticated && router.currentRoute.value.meta.requiresAuth) {
      router.push('/login')
    }
  }
)
</script>
