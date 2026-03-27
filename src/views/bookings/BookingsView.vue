<template>
  <section class="page-wrap">
    <article class="panel">
      <div class="title-row">
        <div>
          <h2>📅 Bronlar (Band qilingan kompyuterlar)</h2>
          <p class="subtitle">Kompyuterlar bron qilingan vaqt oralig'i</p>
        </div>
        <div class="action-buttons">
          <div class="filter-group">
            <button 
              type="button" 
              class="filter-btn" 
              :class="{ active: activeFilter === 'all' }"
              @click="setFilter('all')"
            >
              📋 Hammasi
            </button>
            <button 
              type="button" 
              class="filter-btn" 
              :class="{ active: activeFilter === 'active' }"
              @click="setFilter('active')"
            >
              ✅ Faol
            </button>
            <button 
              type="button" 
              class="filter-btn" 
              :class="{ active: activeFilter === 'confirmed' }"
              @click="setFilter('confirmed')"
            >
              ✓ Tasdiqlangan
            </button>
            <button 
              type="button" 
              class="filter-btn" 
              :class="{ active: activeFilter === 'pending' }"
              @click="setFilter('pending')"
            >
              ⏳ Kutilmoqda
            </button>
          </div>
          <button type="button" class="btn refresh" :disabled="loading" @click="runGetAll">
            <span class="btn-icon">🔄</span>
            {{ loading ? 'Yangilanmoqda...' : 'Yangilash' }}
          </button>
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Yuklanmoqda...</p>
      </div>

      <div v-else-if="filteredRows.length" class="bookings-grid">
        <div 
          v-for="item in filteredRows" 
          :key="item.id || item.bookingId" 
          class="booking-card"
          :class="getCardClass(item.status)"
        >
          <div class="card-header">
            <div class="computer-info-large">
              <span class="computer-icon-large">💻</span>
              <div>
                <h4>{{ item.computer?.name || item.computerName || 'Kompyuter' }}</h4>
                <span class="computer-id">ID: {{ item.computerId || item.computer?.id || '-' }}</span>
              </div>
            </div>
            <span :class="['status-badge-large', getStatusClass(item.status)]">
              {{ getStatusText(item.status) }}
            </span>
          </div>

          <div class="booking-details">
            <div class="detail-row">
              <span class="detail-label">📅 Bron qilingan vaqt:</span>
              <span class="detail-value">{{ formatDateTimeRange(item.bookedFrom, item.bookedUntil) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">⏰ Boshlanish:</span>
              <span class="detail-value">{{ formatDateTime(item.bookedFrom) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">⏰ Tugash:</span>
              <span class="detail-value">{{ formatDateTime(item.bookedUntil) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">📊 Davomiylik:</span>
              <span class="detail-value highlight">{{ formatDuration(item.bookedFrom, item.bookedUntil) }}</span>
            </div>
          </div>

          <div class="card-footer">
            <div class="status-info">
              <span class="status-label">Holati:</span>
              <span :class="['status-text', getStatusClass(item.status)]">
                {{ getStatusText(item.status) }}
              </span>
            </div>
            <div class="action-buttons-card">
              <button 
                v-if="item.status !== 'cancelled' && item.status !== 'expired'"
                class="btn small danger" 
                @click="runCancel(item.id || item.bookingId)"
                :disabled="loading"
              >
                ❌ Bekor qilish
              </button>
              <button 
                v-if="item.status === 'pending'" 
                class="btn small success" 
                @click="runConfirm(item.id || item.bookingId)"
                :disabled="loading"
              >
                ✓ Tasdiqlash
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <div class="empty-icon">📭</div>
        <h3>Hozircha hech qanday bron yo‘q</h3>
        <p>Computers sahifasidan kompyuterlarni bron qiling.</p>
        <button class="btn primary" @click="$router.push('/computers')">
          ➕ Kompyuterlarni ko‘rish
        </button>
      </div>
    </article>

    <article class="panel json-panel">
      <div class="panel-header">
        <h3>📡 API javobi</h3>
        <button class="btn small" @click="lastResponse = null" v-if="lastResponse">
          Tozalash
        </button>
      </div>
      <pre class="json-box">{{ pretty(lastResponse) }}</pre>
    </article>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import bookingsApi from '@/api/bookings'

const router = useRouter()
const rows = ref([])
const lastResponse = ref(null)
const loading = ref(false)
const activeFilter = ref('active')

const formatDateTime = (iso) => {
  if (!iso) return '-'
  const date = new Date(iso)
  if (isNaN(date.getTime())) return '-'
  return date.toLocaleString('uz-UZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

const formatDateTimeRange = (from, to) => {
  if (!from || !to) return '-'
  const fromDate = formatDateTime(from)
  const toDate = formatDateTime(to)
  return `${fromDate} - ${toDate}`
}

const formatDuration = (from, to) => {
  if (!from || !to) return '-'
  const start = new Date(from)
  const end = new Date(to)
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return '-'
  
  const diffMs = end - start
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  
  if (diffHours > 0) {
    return `${diffHours} soat ${diffMinutes} minut`
  }
  return `${diffMinutes} minut`
}

const getStatusClass = (status) => {
  if (status === 'confirmed') return 'confirmed'
  if (status === 'pending') return 'pending'
  if (status === 'cancelled') return 'cancelled'
  if (status === 'expired') return 'expired'
  return ''
}

const getCardClass = (status) => {
  if (status === 'confirmed') return 'card-confirmed'
  if (status === 'pending') return 'card-pending'
  if (status === 'cancelled') return 'card-cancelled'
  if (status === 'expired') return 'card-expired'
  return ''
}

const getStatusText = (status) => {
  const statusMap = {
    confirmed: 'Tasdiqlangan',
    pending: 'Kutilmoqda',
    cancelled: 'Bekor qilingan',
    expired: 'Muddati o‘tgan'
  }
  return statusMap[status] || status || 'Nomaʼlum'
}

const filteredRows = computed(() => {
  if (activeFilter.value === 'all') {
    return rows.value
  }
  
  if (activeFilter.value === 'active') {
    return rows.value.filter(item => 
      item.status !== 'cancelled' && item.status !== 'expired'
    )
  }
  
  return rows.value.filter(item => item.status === activeFilter.value)
})

const setFilter = (filter) => {
  activeFilter.value = filter
}

const pretty = (value) => {
  if (!value) return 'Hech qanday maʼlumot yo‘q'
  try {
    return JSON.stringify(value, null, 2)
  } catch (error) {
    return String(value)
  }
}

const runWithToast = async (request, successMsg) => {
  loading.value = true
  try {
    const response = await request()
    lastResponse.value = response
    let allBookings = Array.isArray(response) 
      ? response 
      : response?.bookings || response?.items || response?.data || []
    
    rows.value = allBookings
    
    if (successMsg) {
      ElMessage({
        message: successMsg,
        type: 'success',
        duration: 3000
      })
    }
    return response
  } catch (error) {
    ElMessage({
      message: error?.response?.data?.message || error?.message || 'Xatolik yuz berdi',
      type: 'error',
      duration: 5000
    })
    return null
  } finally {
    loading.value = false
  }
}

const runGetAll = () => runWithToast(() => bookingsApi.getAllBookings(), 'Bronlar yangilandi')
const runCancel = (id) => {
  if (!id) {
    ElMessage.warning('Bron ID topilmadi')
    return
  }
  runWithToast(() => bookingsApi.cancelBooking(id), 'Bron bekor qilindi')
}
const runConfirm = (id) => {
  if (!id) {
    ElMessage.warning('Bron ID topilmadi')
    return
  }
  runWithToast(() => bookingsApi.confirmBooking(id), 'Bron tasdiqlandi')
}
</script>

<style scoped>
.page-wrap {
  display: grid;
  gap: 24px;
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  background: linear-gradient(135deg, #0a0f1a 0%, #0c1220 100%);
  min-height: 100vh;
}

.panel {
  background: linear-gradient(145deg, rgba(15, 25, 45, 0.95), rgba(10, 18, 32, 0.95));
  backdrop-filter: blur(10px);
  border-radius: 24px;
  border: 1px solid rgba(74, 144, 226, 0.2);
  padding: 24px;
  transition: all 0.3s ease;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.panel:hover {
  border-color: rgba(74, 144, 226, 0.4);
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.3);
}

.json-panel {
  background: linear-gradient(145deg, rgba(10, 18, 30, 0.98), rgba(8, 14, 24, 0.98));
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(74, 144, 226, 0.2);
}

.title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  flex-wrap: wrap;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(74, 144, 226, 0.2);
}

.title-row h2 {
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(135deg, #fff 0%, #7db9ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  color: #8a9dc0;
  font-size: 14px;
  margin-top: 8px;
}

.action-buttons {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  gap: 8px;
  background: rgba(10, 28, 57, 0.5);
  padding: 4px;
  border-radius: 12px;
  border: 1px solid rgba(74, 144, 226, 0.3);
}

.filter-btn {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  background: transparent;
  border: none;
  color: #8a9dc0;
}

.filter-btn:hover {
  color: #b8ceff;
  background: rgba(74, 144, 226, 0.1);
}

.filter-btn.active {
  background: linear-gradient(135deg, rgba(74, 144, 226, 0.3), rgba(74, 144, 226, 0.2));
  color: #7db9ff;
  border: 1px solid rgba(74, 144, 226, 0.5);
}

/* Bookings Grid */
.bookings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 20px;
}

.booking-card {
  background: rgba(10, 28, 57, 0.6);
  border-radius: 20px;
  border: 1px solid rgba(74, 144, 226, 0.3);
  overflow: hidden;
  transition: all 0.3s ease;
}

.booking-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
  border-color: rgba(74, 144, 226, 0.6);
}

.card-confirmed {
  border-left: 4px solid #6bc46b;
}

.card-pending {
  border-left: 4px solid #ffc107;
}

.card-cancelled {
  border-left: 4px solid #adb5bd;
  opacity: 0.7;
}

.card-expired {
  border-left: 4px solid #ff6b6b;
  opacity: 0.7;
}

.card-header {
  padding: 16px 20px;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(74, 144, 226, 0.2);
}

.computer-info-large {
  display: flex;
  align-items: center;
  gap: 12px;
}

.computer-icon-large {
  font-size: 32px;
}

.computer-info-large h4 {
  margin: 0;
  color: #fff;
  font-size: 18px;
  font-weight: 600;
}

.computer-id {
  font-size: 11px;
  color: #7db9ff;
  font-family: monospace;
}

.status-badge-large {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.status-badge-large.confirmed {
  background: rgba(40, 167, 69, 0.2);
  border: 1px solid rgba(40, 167, 69, 0.4);
  color: #6bc46b;
}

.status-badge-large.pending {
  background: rgba(255, 193, 7, 0.2);
  border: 1px solid rgba(255, 193, 7, 0.4);
  color: #ffc107;
}

.status-badge-large.cancelled {
  background: rgba(108, 117, 125, 0.2);
  border: 1px solid rgba(108, 117, 125, 0.4);
  color: #adb5bd;
}

.status-badge-large.expired {
  background: rgba(220, 53, 69, 0.2);
  border: 1px solid rgba(220, 53, 69, 0.4);
  color: #ff6b6b;
}

.booking-details {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 8px 0;
  border-bottom: 1px dashed rgba(74, 144, 226, 0.2);
}

.detail-label {
  color: #9ec0e4;
  font-size: 13px;
  font-weight: 500;
}

.detail-value {
  color: #d4e4ff;
  font-size: 14px;
  font-weight: 500;
}

.detail-value.highlight {
  color: #7db9ff;
  font-weight: 600;
  font-size: 15px;
}

.card-footer {
  padding: 16px 20px;
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid rgba(74, 144, 226, 0.2);
  flex-wrap: wrap;
  gap: 12px;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-label {
  color: #9ec0e4;
  font-size: 12px;
}

.status-text {
  font-size: 13px;
  font-weight: 600;
}

.status-text.confirmed {
  color: #6bc46b;
}

.status-text.pending {
  color: #ffc107;
}

.status-text.cancelled {
  color: #adb5bd;
  text-decoration: line-through;
}

.status-text.expired {
  color: #ff6b6b;
}

.action-buttons-card {
  display: flex;
  gap: 8px;
}

/* Buttons */
.btn {
  padding: 10px 20px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 16px;
}

.btn.refresh {
  background: linear-gradient(135deg, rgba(74, 144, 226, 0.2), rgba(74, 144, 226, 0.1));
  border: 1px solid rgba(74, 144, 226, 0.4);
  color: #7db9ff;
}

.btn.refresh:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(74, 144, 226, 0.3), rgba(74, 144, 226, 0.2));
  border-color: rgba(74, 144, 226, 0.6);
  transform: translateY(-2px);
}

.btn.small {
  padding: 6px 14px;
  font-size: 12px;
  gap: 4px;
}

.btn.danger {
  background: linear-gradient(135deg, rgba(220, 53, 69, 0.2), rgba(220, 53, 69, 0.1));
  border: 1px solid rgba(220, 53, 69, 0.4);
  color: #ff6b6b;
}

.btn.danger:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(220, 53, 69, 0.3), rgba(220, 53, 69, 0.2));
  border-color: rgba(220, 53, 69, 0.6);
  transform: translateY(-1px);
}

.btn.success {
  background: linear-gradient(135deg, rgba(40, 167, 69, 0.2), rgba(40, 167, 69, 0.1));
  border: 1px solid rgba(40, 167, 69, 0.4);
  color: #6bc46b;
}

.btn.success:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(40, 167, 69, 0.3), rgba(40, 167, 69, 0.2));
  border-color: rgba(40, 167, 69, 0.6);
  transform: translateY(-1px);
}

.btn.primary {
  background: linear-gradient(135deg, #4a90e2, #2c5aa0);
  color: white;
  border: none;
}

.btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.4);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 3px solid rgba(74, 144, 226, 0.2);
  border-top-color: #4a90e2;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p {
  color: #8a9dc0;
  font-size: 14px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
  opacity: 0.6;
}

.empty-state h3 {
  font-size: 20px;
  color: #b8ceff;
  margin-bottom: 8px;
}

.empty-state p {
  color: #8a9dc0;
  margin-bottom: 24px;
}

.json-box {
  background: rgba(0, 0, 0, 0.4);
  border-radius: 12px;
  padding: 16px;
  overflow-x: auto;
  font-size: 12px;
  color: #a8c0e0;
  font-family: 'Courier New', monospace;
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid rgba(74, 144, 226, 0.2);
}

.json-box::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.json-box::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.json-box::-webkit-scrollbar-thumb {
  background: rgba(74, 144, 226, 0.4);
  border-radius: 4px;
}

.json-box::-webkit-scrollbar-thumb:hover {
  background: rgba(74, 144, 226, 0.6);
}

@media (max-width: 768px) {
  .page-wrap {
    padding: 12px;
    gap: 16px;
  }
  
  .panel {
    padding: 16px;
  }
  
  .bookings-grid {
    grid-template-columns: 1fr;
  }
  
  .title-row {
    flex-direction: column;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .filter-group {
    width: 100%;
    justify-content: center;
  }
  
  .filter-btn {
    flex: 1;
    text-align: center;
  }
  
  .card-footer {
    flex-direction: column;
    align-items: stretch;
  }
  
  .action-buttons-card {
    justify-content: center;
  }
  
  .detail-row {
    flex-direction: column;
    gap: 4px;
  }
}
</style>