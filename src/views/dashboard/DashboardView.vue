<template>
  <section class="dashboard-page">
    <article class="welcome-card">
      <p class="welcome-kicker">Admin dashboard</p>
      <h2>Xush kelibsiz, {{ adminName }}</h2>
      <p class="welcome-text">
        Dashboard ma'lumotlari API orqali real vaqtda yuklanadi.
      </p>
      <div class="quick-row">
        <RouterLink to="/users" class="quick-btn">👥 Foydalanuvchilar</RouterLink>
        <RouterLink to="/computers" class="quick-btn">💻 Kompyuterlar</RouterLink>
        <RouterLink to="/sessions" class="quick-btn">▶️ Sessiyalar</RouterLink>
        <RouterLink to="/bookings" class="quick-btn">📅 Bronlar</RouterLink>
        <RouterLink to="/reports" class="quick-btn">📊 Hisobotlar</RouterLink>
        <button type="button" class="quick-btn" @click="loadDashboard" :disabled="loading">
          {{ loading ? '🔄 Yuklanmoqda...' : '🔄 Yangilash' }}
        </button>
      </div>
    </article>

    <!-- Asosiy statistika kartalari -->
    <div class="stats-grid">
      <article class="metric-card primary">
        <div class="metric-icon">💰</div>
        <div class="metric-content">
          <p class="metric-label">Bugungi daromad</p>
          <h3>{{ formatMoney(metrics.todayRevenue) }}</h3>
          <span class="metric-note">Oxirgi 24 soat</span>
        </div>
      </article>

      <article class="metric-card success">
        <div class="metric-icon">🖥️</div>
        <div class="metric-content">
          <p class="metric-label">Faol sessiyalar</p>
          <h3>{{ metrics.activeSessions }}</h3>
          <span class="metric-note">Hozir ishlatilmoqda</span>
        </div>
      </article>

      <article class="metric-card warning">
        <div class="metric-icon">📊</div>
        <div class="metric-content">
          <p class="metric-label">Jami sessiyalar</p>
          <h3>{{ metrics.totalSessions }}</h3>
          <span class="metric-note">Bugungi</span>
        </div>
      </article>

      <article class="metric-card info">
        <div class="metric-icon">📅</div>
        <div class="metric-content">
          <p class="metric-label">Faol bronlar</p>
          <h3>{{ metrics.activeBookings }}</h3>
          <span class="metric-note">Kutilayotgan</span>
        </div>
      </article>

      <article class="metric-card">
        <div class="metric-icon">💻</div>
        <div class="metric-content">
          <p class="metric-label">Jami kompyuterlar</p>
          <h3>{{ metrics.totalComputers }}</h3>
          <span class="metric-note">Parkdagi kompyuterlar</span>
        </div>
      </article>

      <article class="metric-card">
        <div class="metric-icon">👥</div>
        <div class="metric-content">
          <p class="metric-label">Jami foydalanuvchilar</p>
          <h3>{{ metrics.totalUsers }}</h3>
          <span class="metric-note">Ro'yxatdan o'tgan</span>
        </div>
      </article>
    </div>

    <!-- Kompyuter va sessiya statistikasi -->
    <div class="bottom-grid">
      <article class="glass-card">
        <h3>💻 Kompyuter holati</h3>
        <div class="computer-status-grid">
          <div class="status-item available">
            <span class="status-dot"></span>
            <span>Bo'sh</span>
            <strong>{{ computerStats.available }}</strong>
          </div>
          <div class="status-item busy">
            <span class="status-dot"></span>
            <span>Band</span>
            <strong>{{ computerStats.busy }}</strong>
          </div>
          <div class="status-item maintenance">
            <span class="status-dot"></span>
            <span>Texnik xizmat</span>
            <strong>{{ computerStats.maintenance }}</strong>
          </div>
          <div class="status-item offline">
            <span class="status-dot"></span>
            <span>Offline</span>
            <strong>{{ computerStats.offline }}</strong>
          </div>
        </div>
        <div class="usage-chart">
          <div class="chart-bar">
            <div class="bar-fill" :style="{ width: computerUsagePercent + '%' }"></div>
          </div>
          <p>Kompyuterlardan foydalanish: {{ computerUsagePercent }}%</p>
        </div>
      </article>

      <article class="glass-card">
        <h3>▶️ Faol sessiyalar</h3>
        <div class="active-sessions-list">
          <div v-for="session in activeSessions" :key="session.id" class="session-item">
            <div class="session-info">
              <span class="computer-icon">💻</span>
              <span class="computer-name">{{ session.computerName || `PC-${session.computerId}` }}</span>
              <span class="user-name">👤 {{ session.userName || session.userId }}</span>
            </div>
            <div class="session-time">
              <span class="time-icon">⏱️</span>
              <span>{{ formatDuration(session.durationMinutes) }}</span>
            </div>
          </div>
          <div v-if="!activeSessions.length" class="empty-sessions">
            <span>📭</span>
            <p>Hozircha faol sessiya yo'q</p>
          </div>
        </div>
      </article>

      <article class="glass-card">
        <h3>📊 So'nggi hisobot</h3>
        <div class="report-stats">
          <div class="report-item">
            <span>📅 Sana:</span>
            <strong>{{ lastReport.date || '-' }}</strong>
          </div>
          <div class="report-item">
            <span>💰 Daromad:</span>
            <strong>{{ formatMoney(lastReport.revenue) }}</strong>
          </div>
          <div class="report-item">
            <span>🖥️ Sessiyalar:</span>
            <strong>{{ lastReport.sessions }}</strong>
          </div>
          <div class="report-item">
            <span>⏱️ Umumiy vaqt:</span>
            <strong>{{ formatDuration(lastReport.totalDuration) }}</strong>
          </div>
          <div class="report-item">
            <span>👥 Faol foydalanuvchilar:</span>
            <strong>{{ lastReport.activeUsers }}</strong>
          </div>
        </div>
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
import usersApi from '@/api/users'

const authStore = useAuthStore()

const loading = ref(false)
const activeSessions = ref([])
const computerStats = ref({
  total: 0,
  available: 0,
  busy: 0,
  maintenance: 0,
  offline: 0
})

const metrics = ref({
  todayRevenue: 0,
  activeSessions: 0,
  totalSessions: 0,
  activeBookings: 0,
  totalComputers: 0,
  totalUsers: 0
})

const lastReport = ref({
  date: '',
  revenue: 0,
  sessions: 0,
  totalDuration: 0,
  activeUsers: 0
})

const adminName = computed(() => {
  return authStore.user?.fullName || authStore.user?.username || 'Administrator'
})

const computerUsagePercent = computed(() => {
  if (computerStats.value.total === 0) return 0
  return Math.round((computerStats.value.busy / computerStats.value.total) * 100)
})

const formatMoney = (value) => {
  if (!value && value !== 0) return '0 so\'m'
  return new Intl.NumberFormat('uz-UZ').format(Math.round(value)) + ' so\'m'
}

const formatDuration = (minutes) => {
  if (!minutes && minutes !== 0) return '-'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins} min`
  return `${hours} soat ${mins} min`
}

const formatDateTime = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('uz-UZ', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const extractData = (payload) => {
  if (!payload) return null
  return payload.data ?? payload
}

const loadDashboard = async (showToast = true) => {
  loading.value = true

  try {
    // Barcha API so'rovlarini parallel bajarish
    const [
      dailyReportRes,
      activeSessionsRes,
      computersRes,
      bookingsRes,
      usersRes,
      monthlyReportRes
    ] = await Promise.allSettled([
      reportsApi.getDailyReport(),
      sessionsApi.getActiveSessions(),
      computersApi.getAllComputers(),
      bookingsApi.getAllBookings(),
      usersApi.getUsers(),
      reportsApi.getMonthlyReport()
    ])

    // Daily report
    if (dailyReportRes.status === 'fulfilled') {
      const daily = extractData(dailyReportRes.value) || {}
      lastReport.value = {
        date: daily.date || new Date().toLocaleDateString('uz-UZ'),
        revenue: daily.totalRevenue || daily.revenue || 0,
        sessions: daily.totalSessions || daily.sessionsCount || 0,
        totalDuration: daily.totalDuration || 0,
        activeUsers: daily.activeUsers || 0
      }
      metrics.value.todayRevenue = lastReport.value.revenue
      metrics.value.totalSessions = lastReport.value.sessions
    }

    // Active sessions
    if (activeSessionsRes.status === 'fulfilled') {
      const sessions = extractData(activeSessionsRes.value) || []
      activeSessions.value = Array.isArray(sessions) ? sessions : []
      metrics.value.activeSessions = activeSessions.value.length
    }

    // Computers
    if (computersRes.status === 'fulfilled') {
      let computers = extractData(computersRes.value) || []
      computers = Array.isArray(computers) ? computers : []
      
      computerStats.value.total = computers.length
      computerStats.value.available = computers.filter(c => c.status === 'available').length
      computerStats.value.busy = computers.filter(c => c.status === 'busy').length
      computerStats.value.maintenance = computers.filter(c => c.status === 'maintenance').length
      computerStats.value.offline = computers.filter(c => c.status === 'offline').length
      
      metrics.value.totalComputers = computerStats.value.total
    }

    // Bookings
    if (bookingsRes.status === 'fulfilled') {
      let bookings = extractData(bookingsRes.value) || []
      bookings = Array.isArray(bookings) ? bookings : []
      // Faol bronlar (pending va confirmed)
      metrics.value.activeBookings = bookings.filter(b => 
        b.status === 'pending' || b.status === 'confirmed'
      ).length
    }

    // Users
    if (usersRes.status === 'fulfilled') {
      const users = extractData(usersRes.value) || []
      metrics.value.totalUsers = Array.isArray(users) ? users.length : 0
    }

    // Monthly report for additional stats
    if (monthlyReportRes.status === 'fulfilled') {
      const monthly = extractData(monthlyReportRes.value) || {}
      // Qo'shimcha statistikalar
    }

    if (showToast) {
      ElMessage.success('Dashboard yangilandi')
    }

  } catch (error) {
    console.error('Dashboard error:', error)
    ElMessage.error('Ma\'lumotlarni yuklashda xatolik')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDashboard(false)
})
</script>

<style scoped>
.dashboard-page {
  display: grid;
  gap: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #0a0f1a 0%, #0c1220 100%);
  min-height: 100vh;
}

.welcome-card {
  border-radius: 24px;
  border: 1px solid rgba(74, 144, 226, 0.3);
  background: linear-gradient(145deg, rgba(9, 25, 54, 0.95), rgba(11, 34, 72, 0.85));
  padding: 28px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.welcome-kicker {
  margin: 0;
  letter-spacing: 2px;
  text-transform: uppercase;
  font-size: 12px;
  color: #7db9ff;
  font-weight: 600;
}

.welcome-card h2 {
  margin: 8px 0;
  color: #fff;
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, #fff, #7db9ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.welcome-text {
  margin: 0;
  color: #9ab3d9;
  font-size: 14px;
}

.quick-row {
  margin-top: 24px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.quick-btn {
  border: 1px solid rgba(74, 144, 226, 0.4);
  border-radius: 12px;
  padding: 10px 20px;
  color: #e4f1ff;
  background: linear-gradient(135deg, rgba(32, 117, 231, 0.2), rgba(25, 74, 156, 0.3));
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  font-size: 14px;
}

.quick-btn:hover {
  transform: translateY(-2px);
  background: linear-gradient(135deg, rgba(32, 117, 231, 0.4), rgba(25, 74, 156, 0.5));
  border-color: rgba(74, 144, 226, 0.7);
}

.quick-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.stats-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.metric-card {
  border-radius: 20px;
  border: 1px solid rgba(74, 144, 226, 0.25);
  background: linear-gradient(145deg, rgba(10, 28, 57, 0.85), rgba(8, 20, 44, 0.9));
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.2s ease;
  backdrop-filter: blur(5px);
}

.metric-card:hover {
  transform: translateY(-4px);
  border-color: rgba(74, 144, 226, 0.5);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.metric-icon {
  font-size: 48px;
  opacity: 0.8;
}

.metric-content {
  flex: 1;
}

.metric-label {
  margin: 0;
  color: #9ec0e4;
  font-size: 13px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metric-card h3 {
  margin: 8px 0 4px;
  font-size: 28px;
  color: #fff;
  font-weight: 700;
}

.metric-note {
  color: #8aa9cc;
  font-size: 11px;
}

.bottom-grid {
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
}

.glass-card {
  border-radius: 20px;
  border: 1px solid rgba(74, 144, 226, 0.25);
  background: linear-gradient(145deg, rgba(10, 28, 57, 0.85), rgba(8, 20, 44, 0.9));
  padding: 20px;
  backdrop-filter: blur(5px);
}

.glass-card h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #f4f9ff;
  font-weight: 600;
}

.computer-status-grid {
  display: grid;
  gap: 12px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  transition: all 0.2s ease;
}

.status-item:hover {
  background: rgba(74, 144, 226, 0.1);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 10px;
}

.status-item.available .status-dot { background: #4caf50; box-shadow: 0 0 6px #4caf50; }
.status-item.busy .status-dot { background: #ff9800; box-shadow: 0 0 6px #ff9800; }
.status-item.maintenance .status-dot { background: #f44336; box-shadow: 0 0 6px #f44336; }
.status-item.offline .status-dot { background: #9e9e9e; box-shadow: 0 0 6px #9e9e9e; }

.status-item span:first-of-type {
  flex: 1;
  color: #bdd4ed;
  font-size: 13px;
}

.status-item strong {
  color: #fff;
  font-size: 20px;
  font-weight: 700;
}

.usage-chart {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(74, 144, 226, 0.2);
}

.chart-bar {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  height: 8px;
  overflow: hidden;
  margin-bottom: 8px;
}

.bar-fill {
  background: linear-gradient(90deg, #4caf50, #8bc34a);
  height: 100%;
  border-radius: 10px;
  transition: width 0.3s ease;
}

.usage-chart p {
  margin: 0;
  color: #9ec0e4;
  font-size: 12px;
  text-align: right;
}

.active-sessions-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 300px;
  overflow-y: auto;
}

.session-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  transition: all 0.2s ease;
}

.session-item:hover {
  background: rgba(74, 144, 226, 0.1);
  transform: translateX(4px);
}

.session-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.computer-icon, .time-icon {
  font-size: 14px;
}

.computer-name {
  color: #fff;
  font-weight: 600;
  font-size: 13px;
}

.user-name {
  color: #7db9ff;
  font-size: 12px;
}

.session-time {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #ffb86c;
  font-size: 12px;
  font-weight: 500;
}

.empty-sessions {
  text-align: center;
  padding: 30px 20px;
  color: #8a9dc0;
}

.empty-sessions span {
  font-size: 48px;
  opacity: 0.5;
}

.empty-sessions p {
  margin: 8px 0 0;
  font-size: 14px;
}

.report-stats {
  display: grid;
  gap: 12px;
}

.report-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
}

.report-item span {
  color: #9ec0e4;
  font-size: 13px;
}

.report-item strong {
  color: #fff;
  font-size: 15px;
  font-weight: 600;
}

/* Scrollbar */
.active-sessions-list::-webkit-scrollbar {
  width: 6px;
}

.active-sessions-list::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.active-sessions-list::-webkit-scrollbar-thumb {
  background: rgba(74, 144, 226, 0.5);
  border-radius: 3px;
}

@media (max-width: 768px) {
  .dashboard-page {
    padding: 12px;
    gap: 12px;
  }
  
  .welcome-card {
    padding: 20px;
  }
  
  .welcome-card h2 {
    font-size: 24px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .bottom-grid {
    grid-template-columns: 1fr;
  }
  
  .metric-card h3 {
    font-size: 24px;
  }
  
  .session-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>
