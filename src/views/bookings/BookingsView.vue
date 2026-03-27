<template>
  <section class="page-wrap">
    <article class="panel">
      <div class="title-row">
        <div>
          <h2>📅 Bronlar (Band qilingan kompyuterlar)</h2>
          <p class="subtitle">Faqat bron qilingan kompyuterlar ro‘yxati</p>
        </div>
        <button type="button" class="btn refresh" :disabled="loading" @click="runGetAll">
          <span class="btn-icon">🔄</span>
          {{ loading ? 'Yangilanmoqda...' : 'Yangilash' }}
        </button>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Yuklanmoqda...</p>
      </div>

      <div v-else-if="rows.length" class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>👤 Foydalanuvchi</th>
              <th>💻 Kompyuter</th>
              <th>⏰ Boshlanishi</th>
              <th>⏰ Tugashi</th>
              <th>📊 Status</th>
              <th>⚡ Amallar</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in rows" :key="item.id || item.bookingId">
              <td class="id-col">#{{ item.id ?? item.bookingId ?? '-' }}</td>
              <td class="user-col">
                <div class="user-info">
                  <span class="user-icon">👤</span>
                  {{ item.user?.username || item.username || '-' }}
                </div>
              </td>
              <td class="computer-col">
                <div class="computer-info">
                  <span class="computer-icon">💻</span>
                  {{ item.computer?.name || item.computerName || '-' }}
                </div>
              </td>
              <td class="date-col">{{ formatDate(item.bookedFrom) }}</td>
              <td class="date-col">{{ formatDate(item.bookedUntil) }}</td>
              <td class="status-col">
                <span :class="['status-badge', getStatusClass(item.status)]">
                  {{ getStatusText(item.status) }}
                </span>
              </td>
              <td class="actions-col">
                <button 
                  class="btn small danger" 
                  @click="runCancel(item.id || item.bookingId)"
                  :disabled="loading"
                >
                  ❌ Bekor qilish
                </button>
                <button 
                  v-if="item.status !== 'confirmed'" 
                  class="btn small success" 
                  @click="runConfirm(item.id || item.bookingId)"
                  :disabled="loading"
                >
                  ✓ Tasdiqlash
                </button>
              </td>
            </tr>
          </tbody>
        </table>
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

    <!-- Natija (JSON) -->
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import bookingsApi from '@/api/bookings'

const router = useRouter()
const rows = ref([])
const lastResponse = ref(null)
const loading = ref(false)

const formatDate = (iso) => {
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

const getStatusClass = (status) => {
  if (status === 'confirmed') return 'confirmed'
  if (status === 'pending') return 'pending'
  if (status === 'cancelled') return 'cancelled'
  if (status === 'expired') return 'expired'
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
    rows.value = Array.isArray(response) 
      ? response 
      : response?.bookings || response?.items || response?.data || []
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

/* Panel Cards */
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

/* Title Row */
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

/* Loading State */
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

/* Table Styles */
.table-wrapper {
  overflow-x: auto;
  border-radius: 16px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.data-table thead {
  background: linear-gradient(135deg, rgba(74, 144, 226, 0.15), rgba(74, 144, 226, 0.05));
  border-bottom: 1px solid rgba(74, 144, 226, 0.3);
}

.data-table th {
  padding: 14px 12px;
  text-align: left;
  font-weight: 600;
  color: #b8ceff;
  font-size: 13px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.data-table td {
  padding: 14px 12px;
  border-bottom: 1px solid rgba(74, 144, 226, 0.1);
  color: #d4e4ff;
}

.data-table tbody tr {
  transition: all 0.2s ease;
}

.data-table tbody tr:hover {
  background: rgba(74, 144, 226, 0.05);
  transform: scale(1.01);
}

.id-col {
  font-weight: 600;
  color: #7db9ff;
  font-family: monospace;
}

.user-col, .computer-col {
  font-weight: 500;
}

.user-info, .computer-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-icon, .computer-icon {
  font-size: 16px;
  opacity: 0.8;
}

.date-col {
  font-family: monospace;
  font-size: 12px;
  color: #9ab3d9;
}

/* Status Badges */
.status-col {
  width: 120px;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  letter-spacing: 0.3px;
}

.status-badge.confirmed {
  background: rgba(40, 167, 69, 0.2);
  border: 1px solid rgba(40, 167, 69, 0.4);
  color: #6bc46b;
}

.status-badge.pending {
  background: rgba(255, 193, 7, 0.2);
  border: 1px solid rgba(255, 193, 7, 0.4);
  color: #ffc107;
}

.status-badge.cancelled {
  background: rgba(108, 117, 125, 0.2);
  border: 1px solid rgba(108, 117, 125, 0.4);
  color: #adb5bd;
  text-decoration: line-through;
}

.status-badge.expired {
  background: rgba(220, 53, 69, 0.2);
  border: 1px solid rgba(220, 53, 69, 0.4);
  color: #ff6b6b;
}

/* Actions Column */
.actions-col {
  white-space: nowrap;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* Empty State */
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

/* JSON Box */
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

/* Responsive Design */
@media (max-width: 1024px) {
  .page-wrap {
    padding: 16px;
  }
  
  .panel {
    padding: 20px;
  }
  
  .title-row h2 {
    font-size: 24px;
  }
}

@media (max-width: 768px) {
  .page-wrap {
    padding: 12px;
    gap: 16px;
  }
  
  .panel {
    padding: 16px;
  }
  
  .title-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .title-row h2 {
    font-size: 20px;
  }
  
  .data-table th,
  .data-table td {
    padding: 10px 8px;
    font-size: 12px;
  }
  
  .actions-col {
    flex-direction: column;
    gap: 4px;
  }
  
  .btn.small {
    padding: 4px 10px;
    font-size: 11px;
  }
  
  .status-badge {
    font-size: 10px;
    padding: 3px 8px;
  }
}

@media (max-width: 640px) {
  .data-table {
    font-size: 11px;
  }
  
  .date-col {
    font-size: 10px;
  }
  
  .id-col {
    font-size: 11px;
  }
}
</style>