<template>
  <div class="admin-shell">
    <div class="shell-noise"></div>
    <div class="shell-glow shell-glow-left"></div>
    <div class="shell-glow shell-glow-right"></div>

    <Sidebar :open="isSidebarOpen" @close="closeSidebar" />

    <div class="admin-main">
      <Header @toggle-sidebar="toggleSidebar" />
      <main class="admin-content">
        <router-view />
      </main>
    </div>

    <button
      v-if="isSidebarOpen"
      type="button"
      class="mobile-overlay"
      aria-label="Sidebarni yopish"
      @click="closeSidebar"
    ></button>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import Sidebar from './Sidebar.vue'
import Header from './Header.vue'

const route = useRoute()
const isSidebarOpen = ref(false)

const closeSidebar = () => {
  isSidebarOpen.value = false
}

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

watch(
  () => route.fullPath,
  () => {
    closeSidebar()
  }
)
</script>

<style scoped>
.admin-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 280px 1fr;
  position: relative;
  background:
    radial-gradient(900px 500px at 10% 8%, rgba(0, 159, 255, 0.18), transparent 65%),
    radial-gradient(700px 500px at 95% 20%, rgba(29, 91, 255, 0.18), transparent 65%),
    linear-gradient(150deg, #030712, #0a1630 45%, #081225);
  overflow: hidden;
}

.admin-main {
  min-width: 0;
  display: grid;
  grid-template-rows: auto 1fr;
  z-index: 2;
}

.admin-content {
  padding: 24px;
}

.shell-glow {
  position: absolute;
  width: 420px;
  height: 420px;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.32;
  pointer-events: none;
}

.shell-glow-left {
  background: #0ba5ff;
  left: -120px;
  top: 120px;
}

.shell-glow-right {
  background: #3b82f6;
  right: -150px;
  bottom: -120px;
}

.shell-noise {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.14;
  background-image:
    linear-gradient(rgba(58, 125, 244, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(58, 125, 244, 0.06) 1px, transparent 1px);
  background-size: 28px 28px;
}

.mobile-overlay {
  position: fixed;
  inset: 0;
  border: 0;
  padding: 0;
  background: rgba(2, 8, 20, 0.72);
  z-index: 9;
}

@media (max-width: 1080px) {
  .admin-shell {
    grid-template-columns: 1fr;
  }

  .admin-content {
    padding: 16px;
  }
}

@media (max-width: 680px) {
  .admin-content {
    padding: 12px;
  }

  .shell-glow {
    display: none;
  }
}
</style>
