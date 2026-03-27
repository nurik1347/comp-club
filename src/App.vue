<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { initSocket } from '@/api/socket'

const authStore = useAuthStore()

onMounted(async () => {
  if (authStore.accessToken) {
    await authStore.getMeSafe()
    initSocket()
  }
})
</script>

<style>
</style>
