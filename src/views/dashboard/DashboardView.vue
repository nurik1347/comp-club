<template>
  <section class="dashboard-page">
    <article class="welcome-card">
      <p class="welcome-kicker">Admin dashboard</p>
      <h2>Xush kelibsiz, {{ adminName }}</h2>
      <p class="welcome-text">
        Dashboard ma'lumotlari API orqali real vaqtda yuklanadi.
      </p>
      <div class="quick-row">
        <RouterLink to="/users" class="quick-btn">Foydalanuvchilar</RouterLink>
        <RouterLink to="/computers" class="quick-btn">Kompyuterlar</RouterLink>
        <RouterLink to="/sessions" class="quick-btn">Sessiyalar</RouterLink>
        <RouterLink to="/bookings" class="quick-btn">Bronlar</RouterLink>
        <button type="button" class="quick-btn" @click="loadDashboard" :disabled="loading">
          {{ loading ? 'Yuklanmoqda...' : 'Yangilash' }}
        </button>
      </div>
    </article>

    <div class="stats-grid">
      <article v-for="item in metrics" :key="item.label" class="metric-card">
        <p class="metric-label">{{ item.label }}</p>
        <h3>{{ item.value }}</h3>
        <span class="metric-note">{{ item.note }}</span>
      </article>
    </div>

    <div class="bottom-grid">
      <article class="glass-card">
        <h3>Faol sessiyalar (API)</h3>
        <ul>
          <li v-for="event in timeline" :key="event.label + event.time">
            <span>{{ event.label }}</span>
            <strong>{{ event.time }}</strong>
          </li>
          <li v-if="!timeline.length">
            <span>Hozircha faol sessiya yo`q</span>
            <strong>-</strong>
          </li>
        </ul>
      </article>

      <article class="glass-card">
        <h3>Kompyuter statuslari (API)</h3>
        <ul>
          <li>
            <span>Available</span>
            <strong>{{ computerStats.available }}</strong>
          </li>
          <li>
            <span>Busy</span>
            <strong>{{ computerStats.busy }}</strong>
          </li>
          <li>
            <span>Maintenance</span>
            <strong>{{ computerStats.maintenance }}</strong>
          </li>
          <li>
            <span>Offline</span>
            <strong>{{ computerStats.offline }}</strong>
          </li>
        </ul>
      </article>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import reportsApi from '@/api/reports'
import sessionsApi from '@/api/sessions'
import computersApi from '@/api/computers'
import bookingsApi from '@/api/bookings'

const authStore = useAuthStore()

const loading = ref(false)
const metrics = ref([])
const timeline = ref([])
const computerStats = ref({
  available: 0,
  busy: 0,
  maintenance: 0,
  offline: 0
})

const adminName = computed(() => {
  return authStore.user?.fullName || authStore.user?.username || 'Administrator'
})

const extractBody = (payload) => payload?.data ?? payload ?? null
const asArray = (payload) => {
  const body = extractBody(payload)

  if (Array.isArray(body)) return body
  if (Array.isArray(body?.items)) return body.items
  if (Array.isArray(body?.results)) return body.results
  if (Array.isArray(body?.sessions)) return body.sessions
  if (Array.isArray(body?.computers)) return body.computers
  if (Array.isArray(body?.bookings)) return body.bookings

  return []
}

const safeNumber = (value, fallback = 0) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

const formatMoney = (value) => `${new Intl.NumberFormat('ru-RU').format(safeNumber(value))} so'm`

const loadDashboard = async () => {
  loading.value = true

  try {
    const [dailyRes, activeSessionsRes, computersRes, bookingsRes] = await Promise.all([
      reportsApi.getDailyReport(),
      sessionsApi.getActiveSessions(),
      computersApi.getAllComputers(),
      bookingsApi.getAllBookings()
    ])

    const daily = extractBody(dailyRes) || {}
    const activeSessions = asArray(activeSessionsRes)
    const computers = asArray(computersRes)
    const bookings = asArray(bookingsRes)

    const availableCount = computers.filter((item) => item.status === 'available').length
    const busyCount = computers.filter((item) => item.status === 'busy').length
    const maintenanceCount = computers.filter((item) => item.status === 'maintenance').length
    const offlineCount = computers.filter((item) => item.status === 'offline').length

    computerStats.value = {
      available: availableCount,
      busy: busyCount,
      maintenance: maintenanceCount,
      offline: offlineCount
    }

    const totalRevenue =
      daily.totalRevenue ?? daily.revenue ?? daily.total_amount ?? daily.total ?? daily.todayRevenue ?? 0
    const sessionsCount = daily.sessionsCount ?? daily.totalSessions ?? activeSessions.length
    const activePcCount = daily.activeComputers ?? busyCount

    metrics.value = [
      {
        label: 'Faol sessiyalar',
        value: String(activeSessions.length),
        note: `Umumiy sessiya: ${sessionsCount}`
      },
      {
        label: 'Bo`sh kompyuterlar',
        value: String(availableCount),
        note: `Busy: ${busyCount}, Offline: ${offlineCount}`
      },
      {
        label: 'Bugungi daromad',
        value: formatMoney(totalRevenue),
        note: `Active PC: ${activePcCount}`
      },
      {
        label: 'Bronlar soni',
        value: String(bookings.length),
        note: 'Get All Bookings endpointidan'
      }
    ]

    timeline.value = activeSessions.slice(0, 6).map((session) => ({
      label:
        session.computerName ||
        session.computer?.name ||
        `PC-${session.computerId ?? session.computer?.id ?? '-'}`,
      time: session.startedAt || session.startTime || session.createdAt || '-'
    }))
  } catch (error) {
    ElMessage.error(error?.message || 'Dashboard ma`lumotlarini yuklab bo`lmadi')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadDashboard()
})
</script>

<style scoped>
.dashboard-page {
  display: grid;
  gap: 16px;
}

.welcome-card {
  border-radius: 22px;
  border: 1px solid rgba(117, 183, 255, 0.3);
  background: linear-gradient(145deg, rgba(9, 25, 54, 0.92), rgba(11, 34, 72, 0.68));
  padding: 22px;
  box-shadow: 0 24px 42px rgba(4, 13, 31, 0.48);
}

.welcome-kicker {
  margin: 0;
  letter-spacing: 2px;
  text-transform: uppercase;
  font-size: 12px;
  color: #9ec5ff;
}

.welcome-card h2 {
  margin: 8px 0;
  color: #f5fbff;
  font-size: 30px;
}

.welcome-text {
  margin: 0;
  color: #afc4df;
  max-width: 760px;
}

.quick-row {
  margin-top: 18px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.quick-btn {
  border: 1px solid rgba(132, 195, 255, 0.48);
  border-radius: 999px;
  padding: 10px 14px;
  color: #ecf7ff;
  background: linear-gradient(180deg, rgba(32, 117, 231, 0.66), rgba(25, 74, 156, 0.7));
  font-weight: 600;
  cursor: pointer;
}

.quick-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.stats-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.metric-card {
  border-radius: 18px;
  border: 1px solid rgba(122, 185, 255, 0.3);
  background: linear-gradient(150deg, rgba(8, 22, 48, 0.9), rgba(9, 20, 41, 0.8));
  padding: 16px;
}

.metric-label {
  margin: 0;
  color: #8eb3de;
  font-size: 13px;
}

.metric-card h3 {
  margin: 8px 0 4px;
  font-size: 26px;
  color: #f6fbff;
}

.metric-note {
  color: #9ab8da;
  font-size: 12px;
}

.bottom-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.glass-card {
  border-radius: 18px;
  border: 1px solid rgba(120, 180, 255, 0.28);
  background: linear-gradient(145deg, rgba(7, 18, 39, 0.88), rgba(10, 27, 58, 0.72));
  padding: 18px;
}

.glass-card h3 {
  margin: 0 0 10px;
  font-size: 20px;
  color: #f6fbff;
}

ul {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 10px;
}

li {
  color: #b5cae3;
  border: 1px solid rgba(128, 188, 255, 0.18);
  border-radius: 12px;
  padding: 10px 12px;
  background: rgba(13, 35, 72, 0.38);
}

li strong {
  color: #f4f9ff;
}

.bottom-grid li {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

@media (max-width: 620px) {
  .welcome-card h2 {
    font-size: 24px;
  }
}
</style>
