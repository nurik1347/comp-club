<template>
  <aside class="sidebar" :class="{ open }">
    <div class="sidebar-head">
      <div>
        <p class="label">CompRoom</p>
        <h2 class="brand">Admin Core</h2>
      </div>
      <button type="button" class="close-btn" @click="emit('close')">Yopish</button>
    </div>

    <nav class="nav-list">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="nav-link"
        :class="{ active: isActive(item.to) }"
        @click="emit('close')"
      >
        <span class="nav-badge">{{ item.badge }}</span>
        <span>{{ item.label }}</span>
      </RouterLink>
    </nav>

    <div class="sidebar-footer">
      <p class="user-role">Admin sessiya</p>
      <h3 class="user-name">{{ adminName }}</h3>
      <button type="button" class="logout-btn" @click="handleLogout">Chiqish</button>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

defineProps({
  open: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const navItems = [
  { label: 'Dashboard', to: '/', badge: 'DB' },
  { label: 'Foydalanuvchilar', to: '/users', badge: 'US' },
  { label: 'Zonalar', to: '/zones', badge: 'ZN' },
  { label: 'Kompyuterlar', to: '/computers', badge: 'PC' },
  { label: 'Tariflar', to: '/tariffs', badge: 'TF' },
  { label: 'Sessiyalar', to: '/sessions', badge: 'SE' },
  { label: 'Tranzaksiyalar', to: '/transactions', badge: 'TR' },
  { label: 'Bronlar', to: '/bookings', badge: 'BK' },
  { label: 'Hisobotlar', to: '/reports', badge: 'RP' },
  { label: 'Realtime', to: '/realtime', badge: 'WS' }
]

const adminName = computed(() => {
  return authStore.user?.fullName || authStore.user?.username || 'Administrator'
})

const isActive = (path) => {
  if (path === '/') {
    return route.path === '/'
  }

  return route.path.startsWith(path)
}

const handleLogout = async () => {
  await authStore.logout()
  emit('close')
  router.push('/login')
}
</script>

<style scoped>
.sidebar {
  background: linear-gradient(180deg, rgba(3, 10, 22, 0.94), rgba(6, 16, 36, 0.9));
  border-right: 1px solid rgba(120, 175, 255, 0.18);
  backdrop-filter: blur(12px);
  padding: 22px 18px;
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 18px;
  z-index: 11;
}

.sidebar-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.label {
  margin: 0 0 4px;
  text-transform: uppercase;
  letter-spacing: 2.2px;
  font-size: 11px;
  color: rgba(172, 198, 255, 0.72);
}

.brand {
  margin: 0;
  font-size: 22px;
  letter-spacing: 1px;
  color: #f1f7ff;
}

.close-btn {
  border: 1px solid rgba(139, 186, 255, 0.35);
  background: rgba(18, 38, 76, 0.6);
  color: #dbeafe;
  border-radius: 10px;
  padding: 6px 10px;
  font-weight: 600;
  cursor: pointer;
  display: none;
}

.nav-list {
  display: grid;
  gap: 10px;
  align-content: start;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #a7bddf;
  border: 1px solid transparent;
  border-radius: 14px;
  padding: 11px 12px;
  background: transparent;
  transition: all 0.25s ease;
}

.nav-link:hover {
  color: #eff7ff;
  border-color: rgba(92, 152, 255, 0.28);
  background: rgba(36, 87, 165, 0.2);
}

.nav-link.active {
  color: #ffffff;
  border-color: rgba(120, 175, 255, 0.58);
  background: linear-gradient(135deg, rgba(18, 86, 186, 0.66), rgba(22, 44, 100, 0.72));
  box-shadow: 0 10px 24px rgba(9, 39, 90, 0.36);
}

.nav-badge {
  width: 30px;
  height: 30px;
  border-radius: 9px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  letter-spacing: 0.8px;
  color: #ccf0ff;
  border: 1px solid rgba(133, 203, 255, 0.55);
  background: rgba(8, 52, 124, 0.42);
}

.sidebar-footer {
  border: 1px solid rgba(120, 175, 255, 0.25);
  border-radius: 16px;
  padding: 14px;
  background: linear-gradient(140deg, rgba(8, 22, 46, 0.82), rgba(8, 30, 64, 0.54));
}

.user-role {
  margin: 0;
  color: #9ab2d8;
  font-size: 12px;
}

.user-name {
  margin: 4px 0 12px;
  font-size: 17px;
  color: #f0f8ff;
}

.logout-btn {
  width: 100%;
  border: 1px solid rgba(125, 194, 255, 0.45);
  border-radius: 12px;
  padding: 10px 12px;
  font-weight: 600;
  color: #eff7ff;
  background: linear-gradient(180deg, rgba(30, 108, 210, 0.58), rgba(19, 68, 143, 0.7));
  cursor: pointer;
}

.logout-btn:hover {
  filter: brightness(1.08);
}

@media (max-width: 1080px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: min(320px, 84vw);
    transform: translateX(-110%);
    transition: transform 0.28s ease;
  }

  .sidebar.open {
    transform: translateX(0);
  }

  .close-btn {
    display: inline-flex;
  }
}
</style>
