<template>
  <header class="topbar">
    <button type="button" class="menu-btn" @click="emit('toggle-sidebar')">Menu</button>

    <div class="title-wrap">
      <p class="eyebrow">ADMIN PANEL</p>
      <h1>{{ pageTitle }}</h1>
    </div>

    <div class="meta-wrap">
      <span class="chip">{{ currentTime }}</span>
      <span class="chip strong">{{ adminName }}</span>
    </div>
  </header>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const emit = defineEmits(['toggle-sidebar'])
const route = useRoute()
const authStore = useAuthStore()

const now = ref(new Date())
let timerId = null

onMounted(() => {
  timerId = setInterval(() => {
    now.value = new Date()
  }, 60000)
})

onBeforeUnmount(() => {
  if (timerId) {
    clearInterval(timerId)
  }
})

const pageTitle = computed(() => route.meta?.title || 'Dashboard')

const adminName = computed(() => {
  return authStore.user?.fullName || authStore.user?.username || 'Administrator'
})

const currentTime = computed(() => {
  return new Intl.DateTimeFormat('uz-UZ', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(now.value)
})
</script>

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 24px;
  border-bottom: 1px solid rgba(120, 175, 255, 0.18);
  background: linear-gradient(180deg, rgba(9, 22, 46, 0.86), rgba(8, 16, 33, 0.68));
  backdrop-filter: blur(8px);
}

.menu-btn {
  border: 1px solid rgba(131, 180, 255, 0.45);
  background: rgba(17, 43, 87, 0.68);
  color: #e2f2ff;
  border-radius: 10px;
  padding: 8px 12px;
  font-weight: 600;
  cursor: pointer;
  display: none;
}

.eyebrow {
  margin: 0;
  font-size: 11px;
  letter-spacing: 2px;
  color: rgba(162, 197, 255, 0.8);
}

h1 {
  margin: 2px 0 0;
  font-size: 25px;
  color: #f5f9ff;
  letter-spacing: 0.6px;
}

.meta-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.chip {
  border: 1px solid rgba(140, 191, 255, 0.32);
  border-radius: 999px;
  padding: 8px 12px;
  font-size: 13px;
  color: #bbd4f2;
  background: rgba(9, 34, 72, 0.56);
}

.chip.strong {
  color: #ffffff;
  border-color: rgba(140, 191, 255, 0.52);
  background: linear-gradient(135deg, rgba(32, 102, 208, 0.66), rgba(17, 51, 110, 0.78));
}

@media (max-width: 1080px) {
  .menu-btn {
    display: inline-flex;
  }
}

@media (max-width: 720px) {
  .topbar {
    padding: 12px 14px;
    align-items: flex-start;
  }

  .meta-wrap {
    flex-direction: column;
    align-items: flex-end;
  }

  h1 {
    font-size: 20px;
  }
}

@media (max-width: 560px) {
  .topbar {
    flex-wrap: wrap;
  }

  .menu-btn {
    order: 1;
  }

  .title-wrap {
    order: 2;
    width: 100%;
  }

  .meta-wrap {
    order: 3;
    width: 100%;
    justify-content: flex-start;
    flex-direction: row;
  }

  .chip {
    padding: 6px 10px;
    font-size: 12px;
  }

  h1 {
    font-size: 18px;
  }
}
</style>
