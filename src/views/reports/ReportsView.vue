<template>
  <section class="page-wrap">
    <article class="panel">
      <div class="panel-header">
        <div>
          <h2>📊 Hisobotlar</h2>
          <p>Kunlik, haftalik, oylik va statistik ma'lumotlar</p>
        </div>
      </div>

      <div class="actions">
        <button type="button" class="btn daily" @click="runDaily">📅 Daily</button>
        <button type="button" class="btn weekly" @click="runWeekly">📆 Weekly</button>
        <button type="button" class="btn monthly" @click="runMonthly">📈 Monthly</button>
        <button type="button" class="btn computers" @click="runComputers">💻 Computers stats</button>
        <button type="button" class="btn top-users" @click="runTopUsers">🏆 Top users</button>
        <button type="button" class="btn revenue" @click="runRevenue">💰 Revenue chart</button>
      </div>
    </article>

    <!-- Daily/Weekly/Monthly Report -->
    <article v-if="reportData && (activeReport === 'daily' || activeReport === 'weekly' || activeReport === 'monthly')" class="panel report-panel">
      <div class="panel-header">
        <h3>{{ getReportTitle() }}</h3>
        <span class="report-date">{{ getReportDate() }}</span>
      </div>

      <div class="stats-grid">
        <div class="stat-card primary">
          <div class="stat-icon">💰</div>
          <div class="stat-info">
            <span class="stat-label">Umumiy daromad</span>
            <strong class="stat-value">{{ formatMoney(reportData.totalRevenue) }}</strong>
          </div>
        </div>

        <div class="stat-card success">
          <div class="stat-icon">🖥️</div>
          <div class="stat-info">
            <span class="stat-label">Sessiyalar soni</span>
            <strong class="stat-value">{{ reportData.totalSessions || 0 }}</strong>
          </div>
        </div>

        <div class="stat-card warning">
          <div class="stat-icon">⏱️</div>
          <div class="stat-info">
            <span class="stat-label">Umumiy vaqt</span>
            <strong class="stat-value">{{ formatDuration(reportData.totalDuration) }}</strong>
          </div>
        </div>

        <div class="stat-card info">
          <div class="stat-icon">👥</div>
          <div class="stat-info">
            <span class="stat-label">Faol foydalanuvchilar</span>
            <strong class="stat-value">{{ reportData.activeUsers || 0 }}</strong>
          </div>
        </div>
      </div>

      <div v-if="reportData.dailyStats && reportData.dailyStats.length" class="chart-section">
        <h4>Kunlik statistikalar</h4>
        <div class="daily-stats">
          <div v-for="stat in reportData.dailyStats" :key="stat.date" class="daily-item">
            <div class="daily-date">{{ formatDate(stat.date) }}</div>
            <div class="daily-revenue">{{ formatMoney(stat.revenue) }}</div>
            <div class="daily-sessions">{{ stat.sessions }} sessiya</div>
          </div>
        </div>
      </div>
    </article>

    <!-- Computers Stats -->
    <article v-if="reportData && activeReport === 'computers'" class="panel">
      <div class="panel-header">
        <h3>💻 Kompyuterlar statistikasi</h3>
      </div>

      <div class="computers-stats">
        <div v-for="computer in reportData" :key="computer.computerId" class="computer-stat-card">
          <div class="computer-header">
            <strong>{{ computer.computerName || `PC-${computer.computerNumber}` }}</strong>
            <span class="computer-id">ID: {{ computer.computerId }}</span>
          </div>
          <div class="computer-stats">
            <div class="stat-item">
              <span>🕐 Sessiyalar</span>
              <strong>{{ computer.sessionCount || 0 }}</strong>
            </div>
            <div class="stat-item">
              <span>⏱️ Vaqt</span>
              <strong>{{ formatDuration(computer.totalDuration) }}</strong>
            </div>
            <div class="stat-item">
              <span>💰 Daromad</span>
              <strong>{{ formatMoney(computer.totalRevenue) }}</strong>
            </div>
          </div>
        </div>
      </div>
    </article>

    <article v-if="reportData && activeReport === 'top-users'" class="panel">
      <div class="panel-header">
        <h3>🏆 Eng ko'p pul sarflagan foydalanuvchilar</h3>
      </div>

      <div class="top-users-list">
        <div v-for="(user, index) in reportData" :key="user.userId" class="user-rank-card">
          <div class="rank-badge" :class="getRankClass(index)">
            {{ index + 1 }}
          </div>
          <div class="user-info">
            <strong class="user-name">{{ user.username }}</strong>
            <span class="user-fullname">{{ user.fullName || 'Ism kiritilmagan' }}</span>
          </div>
          <div class="user-stats">
            <div class="stat">
              <span>💰</span>
              <strong>{{ formatMoney(user.totalSpent) }}</strong>
            </div>
            <div class="stat">
              <span>🕐</span>
              <strong>{{ formatDuration(user.totalDuration) }}</strong>
            </div>
            <div class="stat">
              <span>📊</span>
              <strong>{{ user.sessionCount }} sessiya</strong>
            </div>
          </div>
        </div>
      </div>
    </article>

    <article v-if="reportData && activeReport === 'revenue'" class="panel">
      <div class="panel-header">
        <h3>📈 Daromad grafigi (30 kun)</h3>
      </div>

      <div class="chart-wrapper">
        <canvas ref="revenueChart"></canvas>
      </div>

      <div class="chart-summary">
        <div class="summary-item">
          <span>📊 Jami daromad:</span>
          <strong>{{ formatMoney(getTotalRevenue()) }}</strong>
        </div>
        <div class="summary-item">
          <span>📈 O'rtacha:</span>
          <strong>{{ formatMoney(getAverageRevenue()) }}</strong>
        </div>
        <div class="summary-item">
          <span>📅 Eng yuqori:</span>
          <strong>{{ formatMoney(getMaxRevenue()) }}</strong>
        </div>
        <div class="summary-item">
          <span>📉 Eng past:</span>
          <strong>{{ formatMoney(getMinRevenue()) }}</strong>
        </div>
      </div>
    </article>

    <article class="panel json-panel" v-if="lastResponse">
      <div class="panel-header">
        <h3>📡 API javobi (raw)</h3>
        <button class="btn small" @click="lastResponse = null">Tozalash</button>
      </div>
      <pre class="json-box">{{ pretty(lastResponse) }}</pre>
    </article>
  </section>
</template>

<script setup>
import { ref, watch, nextTick, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import reportsApi from '@/api/reports'
import Chart from 'chart.js/auto'

const lastResponse = ref(null)
const reportData = ref(null)
const activeReport = ref('')
const revenueChart = ref(null)
let chartInstance = null

const pretty = (value) => {
  if (value === null || value === undefined) return 'Maʼlumot yoʻq'
  return JSON.stringify(value, null, 2)
}

const formatMoney = (value) => {
  if (!value && value !== 0) return '-'
  return new Intl.NumberFormat('uz-UZ', { 
    style: 'currency', 
    currency: 'UZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

const formatMoneyShort = (value) => {
  if (!value) return '0'
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
  return value.toString()
}

const formatDuration = (minutes) => {
  if (!minutes && minutes !== 0) return '-'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins} min`
  return `${hours} soat ${mins} min`
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long' })
}

const formatDateShort = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' })
}

const getReportTitle = () => {
  const titles = {
    daily: '📅 Kunlik hisobot',
    weekly: '📆 Haftalik hisobot',
    monthly: '📈 Oylik hisobot'
  }
  return titles[activeReport.value] || 'Hisobot'
}

const getReportDate = () => {
  if (!reportData.value) return ''
  if (activeReport.value === 'daily') return reportData.value.date || ''
  if (activeReport.value === 'weekly') return `${reportData.value.startDate} - ${reportData.value.endDate}`
  if (activeReport.value === 'monthly') return reportData.value.month || ''
  return ''
}

const getTotalRevenue = () => {
  if (!reportData.value || !Array.isArray(reportData.value)) return 0
  return reportData.value.reduce((sum, item) => sum + (item.revenue || 0), 0)
}

const getAverageRevenue = () => {
  if (!reportData.value || !reportData.value.length) return 0
  return getTotalRevenue() / reportData.value.length
}

const getMaxRevenue = () => {
  if (!reportData.value || !reportData.value.length) return 0
  return Math.max(...reportData.value.map(d => d.revenue || 0))
}

const getMinRevenue = () => {
  if (!reportData.value || !reportData.value.length) return 0
  return Math.min(...reportData.value.map(d => d.revenue || 0))
}

const getRankClass = (index) => {
  if (index === 0) return 'gold'
  if (index === 1) return 'silver'
  if (index === 2) return 'bronze'
  return ''
}

// Chart yaratish funksiyasi
const createRevenueChart = async () => {
  if (!reportData.value || !Array.isArray(reportData.value) || reportData.value.length === 0) return
  
  await nextTick()
  
  const canvas = revenueChart.value
  if (!canvas) return
  
  // Eski chartni o'chirish
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }
  
  const ctx = canvas.getContext('2d')
  
  const dates = reportData.value.map(item => formatDateShort(item.date))
  const revenues = reportData.value.map(item => item.revenue || 0)
  
  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: dates,
      datasets: [
        {
          label: 'Daromad (so\'m)',
          data: revenues,
          backgroundColor: 'rgba(74, 144, 226, 0.8)',
          borderColor: 'rgba(74, 144, 226, 1)',
          borderWidth: 2,
          borderRadius: 8,
          barPercentage: 0.7,
          categoryPercentage: 0.8
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: '#f4f9ff',
            font: {
              size: 12,
              weight: 'bold'
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || ''
              if (label) {
                label += ': '
              }
              label += formatMoney(context.raw)
              return label
            }
          },
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#7db9ff',
          borderColor: '#4a90e2',
          borderWidth: 1
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(125, 190, 255, 0.2)',
            drawBorder: false
          },
          ticks: {
            color: '#9ec0e4',
            callback: function(value) {
              return formatMoneyShort(value)
            },
            stepSize: getMaxRevenue() / 5
          },
          title: {
            display: true,
            text: 'Daromad (so\'m)',
            color: '#9ec0e4',
            font: {
              size: 12
            }
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: '#9ec0e4',
            maxRotation: 45,
            minRotation: 45,
            font: {
              size: 10
            }
          },
          title: {
            display: true,
            text: 'Sanalar',
            color: '#9ec0e4',
            font: {
              size: 12
            }
          }
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeInOutQuart'
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    }
  })
}

// ReportData o'zgarganda chartni yangilash
watch(() => reportData.value, async () => {
  if (activeReport.value === 'revenue' && reportData.value && Array.isArray(reportData.value)) {
    await createRevenueChart()
  }
}, { deep: true })

const runRequest = async (request, reportType, successMessage) => {
  try {
    const data = await request()
    lastResponse.value = data
    reportData.value = data
    activeReport.value = reportType
    
    // Agar revenue chart bo'lsa, chartni yaratish
    if (reportType === 'revenue' && data && Array.isArray(data)) {
      await nextTick()
      createRevenueChart()
    }
    
    ElMessage.success(successMessage)
  } catch (error) {
    console.error(error)
    ElMessage.error(
      error?.response?.data?.message ||
      error?.message ||
      'Hisobotni olib boʻlmadi'
    )
  }
}

const runDaily = () => runRequest(() => reportsApi.getDailyReport(), 'daily', '📅 Kunlik hisobot olindi')
const runWeekly = () => runRequest(() => reportsApi.getWeeklyReport(), 'weekly', '📆 Haftalik hisobot olindi')
const runMonthly = () => runRequest(() => reportsApi.getMonthlyReport(), 'monthly', '📈 Oylik hisobot olindi')
const runComputers = () => runRequest(() => reportsApi.getComputersStats(), 'computers', '💻 Kompyuterlar statistikasi olindi')
const runTopUsers = () => runRequest(() => reportsApi.getTopUsers(), 'top-users', '🏆 Top foydalanuvchilar olindi')
const runRevenue = () => runRequest(() => reportsApi.getRevenueChart(), 'revenue', '💰 Daromad grafigi olindi')

// Component unmount bo'lganda chartni tozalash
onUnmounted(() => {
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }
})
</script>

<style scoped>
.page-wrap {
  display: grid;
  gap: 20px;
  padding: 24px;
  background: linear-gradient(135deg, #0a0f1a 0%, #0c1220 100%);
  min-height: 100vh;
}

.panel {
  border-radius: 20px;
  border: 1px solid rgba(125, 190, 255, 0.3);
  background: linear-gradient(145deg, rgba(8, 20, 44, 0.92), rgba(10, 27, 59, 0.75));
  padding: 20px;
  backdrop-filter: blur(10px);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(125, 190, 255, 0.2);
}

h2, h3 {
  margin: 0;
  color: #f4f9ff;
}

h2 {
  font-size: 28px;
  background: linear-gradient(135deg, #fff, #7db9ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

h3 {
  font-size: 20px;
}

p {
  margin: 8px 0 0;
  color: #a8bfdc;
}

.report-date {
  color: #7db9ff;
  font-size: 14px;
  background: rgba(74, 144, 226, 0.2);
  padding: 4px 12px;
  border-radius: 20px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}

.btn {
  border-radius: 12px;
  padding: 10px 18px;
  border: none;
  background: rgba(20, 50, 99, 0.6);
  color: #e4f1ff;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
}

.btn:hover {
  transform: translateY(-2px);
  background: rgba(33, 83, 153, 0.8);
}

.btn.daily { background: linear-gradient(135deg, rgba(33, 115, 230, 0.7), rgba(24, 72, 151, 0.8)); }
.btn.weekly { background: linear-gradient(135deg, rgba(76, 175, 80, 0.7), rgba(56, 142, 60, 0.8)); }
.btn.monthly { background: linear-gradient(135deg, rgba(255, 152, 0, 0.7), rgba(230, 126, 0, 0.8)); }
.btn.computers { background: linear-gradient(135deg, rgba(156, 39, 176, 0.7), rgba(123, 31, 162, 0.8)); }
.btn.top-users { background: linear-gradient(135deg, rgba(255, 193, 7, 0.7), rgba(255, 160, 0, 0.8)); }
.btn.revenue { background: linear-gradient(135deg, rgba(233, 30, 99, 0.7), rgba(194, 24, 91, 0.8)); }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(10, 28, 57, 0.6);
  border: 1px solid rgba(125, 190, 255, 0.2);
  transition: all 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  border-color: rgba(125, 190, 255, 0.5);
}

.stat-icon {
  font-size: 40px;
}

.stat-info {
  flex: 1;
}

.stat-label {
  display: block;
  color: #9ec0e4;
  font-size: 13px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #fff;
}

.chart-section {
  margin-top: 20px;
}

.chart-section h4 {
  color: #9ec0e4;
  margin-bottom: 16px;
}

.daily-stats {
  display: grid;
  gap: 8px;
}

.daily-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  border-left: 3px solid #4a90e2;
}

.daily-date {
  color: #9ec0e4;
  font-size: 13px;
}

.daily-revenue {
  color: #6bc46b;
  font-weight: 600;
}

.daily-sessions {
  color: #ffb86c;
  font-size: 12px;
}

.computers-stats {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.computer-stat-card {
  background: rgba(10, 28, 57, 0.5);
  border-radius: 14px;
  padding: 16px;
  border: 1px solid rgba(125, 190, 255, 0.2);
}

.computer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(125, 190, 255, 0.2);
}

.computer-header strong {
  color: #fff;
  font-size: 16px;
}

.computer-id {
  color: #7db9ff;
  font-size: 11px;
  font-family: monospace;
}

.computer-stats {
  display: grid;
  gap: 8px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-item span {
  color: #9ec0e4;
  font-size: 12px;
}

.stat-item strong {
  color: #fff;
  font-size: 14px;
}

.top-users-list {
  display: grid;
  gap: 12px;
}

.user-rank-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(10, 28, 57, 0.5);
  border-radius: 14px;
  border: 1px solid rgba(125, 190, 255, 0.2);
  transition: all 0.2s ease;
}

.user-rank-card:hover {
  transform: translateX(4px);
  border-color: rgba(125, 190, 255, 0.5);
}

.rank-badge {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
  border-radius: 12px;
  background: rgba(74, 144, 226, 0.2);
  color: #7db9ff;
}

.rank-badge.gold {
  background: linear-gradient(135deg, #ffd700, #ffb347);
  color: #fff;
}

.rank-badge.silver {
  background: linear-gradient(135deg, #c0c0c0, #a0a0a0);
  color: #fff;
}

.rank-badge.bronze {
  background: linear-gradient(135deg, #cd7f32, #b87333);
  color: #fff;
}

.user-info {
  flex: 1;
}

.user-name {
  display: block;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
}

.user-fullname {
  color: #9ec0e4;
  font-size: 12px;
}

.user-stats {
  display: flex;
  gap: 16px;
}

.user-stats .stat {
  text-align: right;
}

.user-stats .stat span {
  display: block;
  color: #9ec0e4;
  font-size: 11px;
}

.user-stats .stat strong {
  color: #fff;
  font-size: 14px;
}

/* Chart styles */
.chart-wrapper {
  margin: 20px 0;
  padding: 20px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 16px;
  position: relative;
  height: 400px;
}

.chart-wrapper canvas {
  max-height: 400px;
  width: 100% !important;
}

.chart-summary {
  display: flex;
  justify-content: space-around;
  gap: 20px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid rgba(125, 190, 255, 0.2);
  flex-wrap: wrap;
}

.summary-item {
  text-align: center;
  background: rgba(10, 28, 57, 0.5);
  padding: 12px 20px;
  border-radius: 12px;
  min-width: 140px;
}

.summary-item span {
  display: block;
  color: #9ec0e4;
  font-size: 12px;
  margin-bottom: 6px;
}

.summary-item strong {
  color: #fff;
  font-size: 18px;
  font-weight: 700;
}

.json-panel {
  margin-top: 20px;
}

.json-box {
  margin-top: 12px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.4);
  padding: 12px;
  font-size: 12px;
  color: #b8d0f0;
  max-height: 300px;
  overflow: auto;
  font-family: monospace;
}

.btn.small {
  padding: 6px 12px;
  font-size: 12px;
}

@media (max-width: 768px) {
  .page-wrap {
    padding: 12px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .user-rank-card {
    flex-direction: column;
    text-align: center;
  }
  
  .user-stats {
    flex-direction: column;
    gap: 8px;
  }
  
  .user-stats .stat {
    text-align: center;
  }
  
  .chart-wrapper {
    height: 300px;
    padding: 10px;
  }
  
  .chart-wrapper canvas {
    max-height: 300px;
  }
  
  .summary-item {
    min-width: 120px;
    padding: 8px 12px;
  }
  
  .summary-item strong {
    font-size: 14px;
  }
}
</style>