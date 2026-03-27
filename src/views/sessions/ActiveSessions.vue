<template>
  <section class="sessions-page">
    <article class="hero-panel">
      <div class="hero-head">
        <div>
          <p class="kicker">Session Monitor</p>
          <h2>Sessiyalar monitoringi</h2>
          <p class="subtitle">
            Faol va tugallangan sessiyalarni kuzatish va boshqarish
          </p>
        </div>

        <div class="hero-actions">
          <button type="button" class="btn primary" :disabled="loading" @click="runGetAll">
            {{ loading ? 'Yuklanmoqda...' : 'Yangilash' }}
          </button>
          <button type="button" class="btn" :disabled="loading" @click="runGetActive">Faqat active</button>
          <button type="button" class="btn" @click="clearSelection">Tanlovni tozalash</button>
        </div>
      </div>

      <div class="filters-grid">
        <label>
          <span>Status</span>
          <select v-model="filters.status">
            <option value="">all</option>
            <option value="active">active</option>
            <option value="completed">completed</option>
            <option value="cancelled">cancelled</option>
          </select>
        </label>
        <label>
          <span>Start date</span>
          <input v-model="filters.startDate" type="date" />
        </label>
        <label>
          <span>End date</span>
          <input v-model="filters.endDate" type="date" />
        </label>
        <div class="filter-actions">
          <button type="button" class="btn" :disabled="loading" @click="runGetAll">Filter</button>
          <button type="button" class="btn" :disabled="loading" @click="resetFilters">Reset</button>
        </div>
      </div>

      <div class="stat-grid">
        <article class="stat-card">
          <span class="stat-label">Jami sessiya</span>
          <strong>{{ stats.total }}</strong>
        </article>
        <article class="stat-card">
          <span class="stat-label">Active</span>
          <strong>{{ stats.active }}</strong>
        </article>
        <article class="stat-card">
          <span class="stat-label">Completed</span>
          <strong>{{ stats.completed }}</strong>
        </article>
        <article class="stat-card">
          <span class="stat-label">Cancelled</span>
          <strong>{{ stats.cancelled }}</strong>
        </article>
        <article class="stat-card">
          <span class="stat-label">Jami tushum</span>
          <strong>{{ formatMoney(stats.revenue) }}</strong>
        </article>
      </div>
    </article>

    <article class="data-panel">
      <div class="panel-head">
        <h3>Sessiyalar jadvali</h3>
        <p>Sessiyani o'chirish yoki tugatish uchun amallarni bosing</p>
      </div>

      <div class="table-wrap" v-if="sessions.length">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Computer</th>
              <th>Tariff</th>
              <th>Status</th>
              <th>Boshlangan</th>
              <th>Tugagan</th>
              <th>Davomiylik</th>
              <th>Narx</th>
              <th>Amallar</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="session in sessions"
              :key="session.key"
              :class="{ selected: selectedSession?.key === session.key }"
              @click="selectSession(session)"
            >
              <td>{{ session.id ?? '-' }}</td>
              <td>{{ session.userName || session.userId || '-' }}</td>
              <td>{{ session.computerName || session.computerId || '-' }}</td>
              <td>{{ session.tariffName || session.tariffId || '-' }}</td>
              <td>
                <span class="status-pill" :class="`status-${session.status}`">
                  {{ statusText(session.status) }}
                </span>
              </td>
              <td>{{ formatDateTime(session.startedAt) }}</td>
              <td>{{ formatDateTime(session.endedAt) }}</td>
              <td>{{ sessionDurationText(session) }}</td>
              <td>{{ sessionCostText(session) }}</td>
              <td class="actions-col">
                <button 
                  v-if="session.status === 'active'"
                  class="btn small warning" 
                  @click.stop="endSession(session.id)"
                  :disabled="loading"
                >
                  ⏹️ Tugatish
                </button>
                <button 
                  class="btn small danger" 
                  @click.stop="deleteSession(session.id)"
                  :disabled="loading"
                >
                  🗑️ O'chirish
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="empty-box">Hali sessiyalar ma'lumoti yuklanmagan.</div>
    </article>

    <article class="data-panel" v-if="selectedSession">
      <div class="panel-head">
        <h3>Tanlangan sessiya detali</h3>
        <div class="action-buttons">
          <button 
            v-if="selectedSession.status === 'active'"
            class="btn warning" 
            @click="endSession(selectedSession.id)"
          >
            ⏹️ Sessiyani tugatish
          </button>
          <button class="btn danger" @click="deleteSession(selectedSession.id)">🗑️ O'chirish</button>
        </div>
      </div>

      <div class="detail-grid">
        <article class="detail-item"><span>ID</span><strong>{{ selectedSession.id ?? '-' }}</strong></article>
        <article class="detail-item"><span>Status</span><strong>{{ statusText(selectedSession.status) }}</strong></article>
        <article class="detail-item"><span>User</span><strong>{{ selectedSession.userName || selectedSession.userId || '-' }}</strong></article>
        <article class="detail-item"><span>Computer</span><strong>{{ selectedSession.computerName || selectedSession.computerId || '-' }}</strong></article>
        <article class="detail-item"><span>Tariff</span><strong>{{ selectedSession.tariffName || selectedSession.tariffId || '-' }}</strong></article>
        <article class="detail-item"><span>Boshlangan</span><strong>{{ formatDateTime(selectedSession.startedAt) }}</strong></article>
        <article class="detail-item"><span>Tugagan</span><strong>{{ formatDateTime(selectedSession.endedAt) }}</strong></article>
        <article class="detail-item"><span>Davomiylik</span><strong>{{ sessionDurationText(selectedSession) }}</strong></article>
        <article class="detail-item"><span>Narx</span><strong>{{ sessionCostText(selectedSession) }}</strong></article>
      </div>

      <p class="detail-description" v-if="selectedSession.notes">{{ selectedSession.notes }}</p>
    </article>

    <!-- Sessiyani tugatish modal -->
    <Teleport to="body">
      <div v-if="showEndModal" class="modal-overlay" @click.self="closeEndModal">
        <div class="modal-container">
          <div class="modal-header">
            <h3>⏹️ Sessiyani tugatish</h3>
            <button class="close-btn" @click="closeEndModal">✕</button>
          </div>
          
          <div class="modal-body">
            <div class="session-info">
              <div class="info-row">
                <span>Sessiya ID:</span>
                <strong>{{ sessionToEnd?.id }}</strong>
              </div>
              <div class="info-row">
                <span>Kompyuter:</span>
                <strong>{{ sessionToEnd?.computerName || sessionToEnd?.computerId }}</strong>
              </div>
              <div class="info-row">
                <span>Foydalanuvchi:</span>
                <strong>{{ sessionToEnd?.userName || sessionToEnd?.userId }}</strong>
              </div>
              <div class="info-row">
                <span>Boshlangan vaqt:</span>
                <strong>{{ formatDateTime(sessionToEnd?.startedAt) }}</strong>
              </div>
              <div class="info-row">
                <span>Hozirgi davomiylik:</span>
                <strong>{{ sessionDurationText(sessionToEnd) }}</strong>
              </div>
              <div class="info-row highlight">
                <span>💰 Hozirgi narx:</span>
                <strong>{{ sessionCostText(sessionToEnd) }}</strong>
              </div>
            </div>

            <div class="form-group">
              <label>📝 Izoh (ixtiyoriy)</label>
              <textarea 
                v-model="endNotes" 
                placeholder="Sessiya tugatilish sababi..."
                class="modal-textarea"
                rows="3"
              ></textarea>
            </div>

            <div class="warning-box">
              <span>⚠️</span>
              <p>Sessiya tugatilganda:</p>
              <ul>
                <li>Kompyuter avtomatik "bo'sh" holatga o'tadi</li>
                <li>Umumiy narx hisoblanadi va balansdan yechiladi</li>
                <li>Sessiya "completed" statusiga o'tadi</li>
              </ul>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn cancel" @click="closeEndModal">Bekor qilish</button>
            <button type="button" class="btn warning" @click="confirmEndSession" :disabled="endLoading">
              {{ endLoading ? 'Tugatilmoqda...' : 'Sessiyani tugatish' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import sessionsApi from '@/api/sessions'

const sessions = ref([])
const selectedSession = ref(null)
const loading = ref(false)

// End session modal
const showEndModal = ref(false)
const sessionToEnd = ref(null)
const endNotes = ref('')
const endLoading = ref(false)

const filters = reactive({
  status: '',
  startDate: '',
  endDate: ''
})

const moneyFormatter = new Intl.NumberFormat('uz-UZ')

const extractBody = (payload) => payload?.data ?? payload ?? null

const toLooseNumber = (value) => {
  if (value === null || value === undefined) return null
  const direct = Number(value)
  if (Number.isFinite(direct)) return direct
  return null
}

const normalizeStatus = (value) => {
  const status = (value ?? '').toString().trim().toLowerCase()
  if (['active', 'completed', 'cancelled'].includes(status)) return status
  return status || 'unknown'
}

const statusText = (status) => {
  const map = {
    active: 'Active',
    completed: 'Completed',
    cancelled: 'Cancelled',
    unknown: 'Noma`lum'
  }
  return map[normalizeStatus(status)] || status || 'Noma`lum'
}

const normalizeSession = (raw = {}) => {
  const session = raw?.data ?? raw ?? {}
  const id = session.id ?? session.sessionId ?? session.session_id ?? null
  const user = session.user ?? session.userInfo ?? {}
  const computer = session.computer ?? session.computerInfo ?? {}
  const tariff = session.tariff ?? session.tariffInfo ?? {}

  return {
    key: id !== null ? `id-${id}` : `session-${Math.random().toString(36).slice(2, 8)}`,
    id,
    userId: session.userId ?? session.user_id ?? user.id ?? user.userId ?? null,
    userName: session.username ?? session.userName ?? user.username ?? user.fullName ?? null,
    computerId: session.computerId ?? session.computer_id ?? computer.id ?? computer.computerId ?? null,
    computerName: session.computerName ?? computer.name ?? computer.number ?? null,
    tariffId: session.tariffId ?? session.tariff_id ?? tariff.id ?? tariff.tariffId ?? null,
    tariffName: session.tariffName ?? tariff.name ?? null,
    status: normalizeStatus(session.status),
    startedAt: session.startedAt ?? session.startTime ?? session.started_at ?? session.createdAt ?? null,
    endedAt: session.endedAt ?? session.endTime ?? session.ended_at ?? null,
    durationMinutes: toLooseNumber(session.durationMinutes ?? session.duration_minutes ?? session.duration ?? null),
    totalCost: toLooseNumber(session.totalCost ?? session.total_cost ?? session.cost ?? session.amount ?? null),
    notes: session.notes ?? session.comment ?? null
  }
}

const extractSessions = (payload) => {
  const body = extractBody(payload)
  if (Array.isArray(body)) return body.map((item) => normalizeSession(item))
  if (!body || typeof body !== 'object') return []

  const candidates = [body.items, body.sessions, body.results, body.rows, body.data]
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate.map((item) => normalizeSession(item))
  }

  const one = normalizeSession(body)
  return one.id !== null ? [one] : []
}

const formatDateTime = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (isNaN(date.getTime())) return value
  return date.toLocaleString('uz-UZ', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  })
}

const formatMoney = (value) => {
  const numeric = toLooseNumber(value)
  if (numeric === null) return '-'
  return `${moneyFormatter.format(Math.round(numeric))} so'm`
}

const sessionDurationText = (session) => {
  const duration = toLooseNumber(session?.durationMinutes)
  if (duration === null) return '-'
  const hours = Math.floor(duration / 60)
  const mins = duration % 60
  if (hours === 0) return `${mins} min`
  return `${hours} soat ${mins} min`
}

const sessionCostText = (session) => {
  const total = toLooseNumber(session?.totalCost)
  return total !== null ? formatMoney(total) : '-'
}

const stats = computed(() => ({
  total: sessions.value.length,
  active: sessions.value.filter((item) => item.status === 'active').length,
  completed: sessions.value.filter((item) => item.status === 'completed').length,
  cancelled: sessions.value.filter((item) => item.status === 'cancelled').length,
  revenue: sessions.value.reduce((sum, item) => sum + (toLooseNumber(item.totalCost) ?? 0), 0)
}))

const selectSession = (session) => {
  selectedSession.value = session
}

const clearSelection = () => {
  selectedSession.value = null
}

// Sessiyani tugatish modalini ochish
const endSession = (sessionId) => {
  const session = sessions.value.find(s => s.id === sessionId)
  if (!session) {
    ElMessage.warning('Sessiya topilmadi')
    return
  }
  
  if (session.status !== 'active') {
    ElMessage.warning('Faqat faol sessiyalarni tugatish mumkin')
    return
  }
  
  sessionToEnd.value = session
  endNotes.value = ''
  showEndModal.value = true
}

// Sessiyani tugatishni tasdiqlash
const confirmEndSession = async () => {
  if (!sessionToEnd.value) return
  
  endLoading.value = true
  try {
    const payload = {
      notes: endNotes.value.trim() || `${sessionToEnd.value.userName || sessionToEnd.value.userId} tomonidan tugatildi`
    }
    
    await sessionsApi.endSession(sessionToEnd.value.id, payload)
    ElMessage.success('Sessiya muvaffaqiyatli tugatildi!')
    closeEndModal()
    await runGetAll()
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || error?.message || 'Sessiyani tugatishda xatolik')
  } finally {
    endLoading.value = false
  }
}

const closeEndModal = () => {
  showEndModal.value = false
  sessionToEnd.value = null
  endNotes.value = ''
}

// Sessiyani o'chirish
const deleteSession = async (sessionId) => {
  if (!sessionId) {
    ElMessage.warning('Sessiya ID topilmadi')
    return
  }

  try {
    await ElMessageBox.confirm(
      'Sessiyani o\'chirishni tasdiqlaysizmi?',
      'O\'chirish',
      { confirmButtonText: 'Ha', cancelButtonText: 'Yo\'q', type: 'warning' }
    )

    loading.value = true
    await sessionsApi.deleteSession(sessionId)
    ElMessage.success('Sessiya o\'chirildi')
    await runGetAll()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error?.response?.data?.message || error?.message || 'O\'chirishda xatolik')
    }
  } finally {
    loading.value = false
  }
}

const runWithToast = async (request, message) => {
  try {
    const response = await request()
    if (message) ElMessage.success(message)
    return response
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || error?.message || 'So`rov bajarilmadi')
    return null
  }
}

const buildFilterParams = () => ({
  status: filters.status || undefined,
  startDate: filters.startDate || undefined,
  endDate: filters.endDate || undefined
})

const runGetAll = async () => {
  loading.value = true
  const response = await runWithToast(
    () => sessionsApi.getAllSessions(buildFilterParams()),
    'Sessiyalar yuklandi'
  )
  if (response) sessions.value = extractSessions(response)
  loading.value = false
}

const runGetActive = async () => {
  loading.value = true
  const response = await runWithToast(
    () => sessionsApi.getActiveSessions(),
    'Faol sessiyalar yuklandi'
  )
  if (response) sessions.value = extractSessions(response)
  loading.value = false
}

const resetFilters = async () => {
  filters.status = ''
  filters.startDate = ''
  filters.endDate = ''
  await runGetAll()
}

onMounted(() => runGetAll())
</script>

<style scoped>
.sessions-page {
  display: grid;
  gap: 14px;
  padding: 20px;
  background: linear-gradient(135deg, #0a0f1a 0%, #0c1220 100%);
  min-height: 100vh;
}

.hero-panel, .data-panel {
  border-radius: 20px;
  border: 1px solid rgba(125, 190, 255, 0.3);
  background: linear-gradient(145deg, rgba(8, 20, 44, 0.92), rgba(10, 27, 59, 0.75));
  padding: 18px;
}

.hero-head {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
}

.kicker {
  margin: 0;
  font-size: 11px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: #9fc8ff;
}

h2, h3 {
  margin: 4px 0 0;
  color: #f4f9ff;
}

.subtitle, .panel-head p {
  margin: 8px 0 0;
  color: #a8bfdc;
}

.hero-actions, .inline-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filters-grid {
  margin-top: 14px;
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.filters-grid label {
  display: grid;
  gap: 6px;
}

.filters-grid span {
  color: #a7c1e2;
  font-size: 12px;
}

.filter-actions {
  display: flex;
  gap: 8px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.btn {
  border-radius: 10px;
  padding: 9px 12px;
  border: 1px solid rgba(131, 191, 255, 0.45);
  background: rgba(20, 50, 99, 0.54);
  color: #e4f1ff;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn.primary {
  background: linear-gradient(180deg, rgba(33, 115, 230, 0.75), rgba(24, 72, 151, 0.8));
}

.btn.warning {
  border-color: rgba(255, 193, 7, 0.45);
  color: #ffc107;
  background: rgba(255, 193, 7, 0.15);
}

.btn.danger {
  border-color: rgba(255, 131, 131, 0.45);
  color: #ffd5d5;
  background: rgba(124, 38, 38, 0.55);
}

.btn.small {
  padding: 6px 12px;
  font-size: 12px;
}

.btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.stat-grid {
  margin-top: 14px;
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
}

.stat-card {
  border-radius: 14px;
  border: 1px solid rgba(133, 191, 255, 0.28);
  background: rgba(10, 31, 64, 0.52);
  padding: 12px;
  display: grid;
  gap: 6px;
}

.stat-label {
  color: #9ec0e4;
  font-size: 12px;
}

.stat-card strong {
  color: #fff;
  font-size: 22px;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(125, 190, 255, 0.2);
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.table-wrap {
  margin-top: 12px;
  border-radius: 14px;
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  text-align: left;
  padding: 12px 10px;
  border-bottom: 1px solid rgba(136, 195, 255, 0.14);
  color: #bdd1e9;
  font-size: 13px;
}

th {
  color: #95b3d6;
  font-size: 12px;
  text-transform: uppercase;
  background: rgba(10, 26, 53, 0.7);
}

tbody tr {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

tbody tr:hover {
  background: rgba(33, 83, 153, 0.2);
}

tbody tr.selected {
  background: rgba(40, 102, 186, 0.35);
}

.status-pill {
  display: inline-flex;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 11px;
}

.status-active {
  background: rgba(33, 115, 78, 0.35);
  color: #d4ffe5;
  border: 1px solid rgba(111, 214, 165, 0.5);
}

.status-completed {
  background: rgba(30, 79, 145, 0.36);
  color: #d7ecff;
  border: 1px solid rgba(140, 200, 255, 0.4);
}

.status-cancelled {
  background: rgba(126, 48, 48, 0.32);
  color: #f7d9d9;
  border: 1px solid rgba(214, 130, 130, 0.45);
}

.actions-col {
  white-space: nowrap;
  display: flex;
  gap: 6px;
}

.detail-grid {
  margin-top: 12px;
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
}

.detail-item {
  border-radius: 12px;
  border: 1px solid rgba(133, 191, 255, 0.24);
  background: rgba(9, 28, 57, 0.48);
  padding: 10px;
  display: grid;
  gap: 6px;
}

.detail-item span {
  color: #9ec0e4;
  font-size: 12px;
}

.detail-item strong {
  color: #fff;
  font-size: 15px;
}

.detail-description {
  margin: 12px 0 0;
  color: #c0d6ee;
}

.empty-box {
  margin-top: 14px;
  border: 1px dashed rgba(133, 192, 255, 0.3);
  border-radius: 14px;
  padding: 32px;
  text-align: center;
  color: #a9c1e0;
  background: rgba(13, 35, 72, 0.3);
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  background: linear-gradient(145deg, rgba(8, 20, 44, 0.98), rgba(10, 27, 59, 0.95));
  border-radius: 24px;
  border: 1px solid rgba(74, 144, 226, 0.4);
  width: 90%;
  max-width: 500px;
  animation: modalSlideIn 0.3s ease;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 20px;
  border-bottom: 1px solid rgba(74, 144, 226, 0.2);
}

.modal-header h3 {
  margin: 0;
  color: #f4f9ff;
}

.close-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #fff;
  font-size: 20px;
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.modal-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.session-info {
  background: rgba(74, 144, 226, 0.1);
  border-radius: 12px;
  padding: 12px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid rgba(74, 144, 226, 0.2);
}

.info-row:last-child {
  border-bottom: none;
}

.info-row span {
  color: #9ec0e4;
  font-size: 13px;
}

.info-row strong {
  color: #fff;
  font-size: 14px;
}

.info-row.highlight strong {
  color: #ffc107;
  font-size: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  color: #9ec0e4;
  font-size: 13px;
  font-weight: 500;
}

.modal-textarea {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(74, 144, 226, 0.3);
  background: rgba(11, 33, 69, 0.6);
  color: #fff;
  font-size: 14px;
  resize: vertical;
  font-family: inherit;
}

.modal-textarea:focus {
  outline: none;
  border-color: rgba(74, 144, 226, 0.8);
}

.modal-textarea::placeholder {
  color: rgba(158, 192, 228, 0.5);
}

.warning-box {
  background: rgba(255, 193, 7, 0.1);
  border-left: 3px solid #ffc107;
  padding: 12px;
  border-radius: 8px;
  display: flex;
  gap: 10px;
}

.warning-box span {
  font-size: 20px;
}

.warning-box p {
  margin: 0 0 8px 0;
  color: #ffc107;
  font-weight: 600;
}

.warning-box ul {
  margin: 0;
  padding-left: 20px;
}

.warning-box li {
  color: #bdd4ed;
  font-size: 12px;
  margin: 4px 0;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid rgba(74, 144, 226, 0.2);
}

.modal-footer .btn {
  flex: 1;
  justify-content: center;
}

.modal-footer .btn.cancel {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

@media (max-width: 768px) {
  .sessions-page {
    padding: 12px;
  }
  
  .data-table {
    font-size: 12px;
  }
  
  th, td {
    padding: 8px 6px;
  }
  
  .actions-col {
    flex-direction: column;
  }
  
  .modal-container {
    width: 95%;
    margin: 10px;
  }
}
</style>