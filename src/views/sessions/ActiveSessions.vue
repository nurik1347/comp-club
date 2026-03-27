<template>
  <section class="sessions-page">
    <article class="hero-panel">
      <div class="hero-head">
        <div>
          <p class="kicker">Session Control Center</p>
          <h2>Sessiyalar boshqaruvi</h2>
          <p class="subtitle">
            API mantiqiga mos amallar: get all, active, by-id, start, end va real-time cost.
          </p>
        </div>

        <div class="hero-actions">
          <button type="button" class="btn primary" :disabled="loading" @click="runGetAll">
            {{ loading ? 'Yuklanmoqda...' : 'Barchasini yangilash' }}
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
        <p>Qatorga bossangiz action form ID maydonlari avtomatik to'ladi.</p>
      </div>

      <div class="table-wrap" v-if="sessions.length">
        <table>
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
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="empty-box">Hali sessiyalar ma'lumoti yuklanmagan.</div>
    </article>

    <div class="forms-grid">
      <article class="form-card">
        <h3>Start Session</h3>
        <form class="form-grid" @submit.prevent="runStart">
          <label>
            <span>User ID</span>
            <input v-model.number="startForm.userId" type="number" min="1" placeholder="1" />
          </label>

          <label>
            <span>Computer ID</span>
            <input v-model.number="startForm.computerId" type="number" min="1" placeholder="1" />
          </label>

          <label>
            <span>Tariff ID</span>
            <input v-model.number="startForm.tariffId" type="number" min="1" placeholder="1" />
          </label>

          <label>
            <span>Izoh (ixtiyoriy)</span>
            <input v-model.trim="startForm.notes" type="text" placeholder="Ixtiyoriy izoh" />
          </label>

          <button type="submit" class="btn primary">Sessiyani boshlash</button>
        </form>
      </article>

      <article class="form-card">
        <h3>Session Actions</h3>
        <div class="inline-row">
          <input v-model.number="idForm.sessionId" type="number" min="1" placeholder="Session ID" />
          <button type="button" class="btn" @click="runGetById">By ID</button>
        </div>

        <div class="inline-row">
          <input v-model.number="costForm.sessionId" type="number" min="1" placeholder="Session ID" />
          <button type="button" class="btn" @click="runGetCost">Current Cost</button>
        </div>

        <div class="inline-row">
          <input v-model.number="endForm.sessionId" type="number" min="1" placeholder="Session ID" />
          <button type="button" class="btn danger" @click="runEnd">End Session</button>
        </div>

        <div class="selected-box" v-if="selectedSession">
          <p>Tanlangan sessiya</p>
          <strong>ID: {{ selectedSession.id ?? '-' }} | {{ statusText(selectedSession.status) }}</strong>
          <span>{{ selectedSession.userName || selectedSession.userId || '-' }} -> {{ selectedSession.computerName || selectedSession.computerId || '-' }}</span>
        </div>
      </article>
    </div>

    <article class="data-panel" v-if="selectedSession">
      <div class="panel-head">
        <h3>Tanlangan sessiya detail</h3>
      </div>

      <div class="detail-grid">
        <article class="detail-item">
          <span>ID</span>
          <strong>{{ selectedSession.id ?? '-' }}</strong>
        </article>
        <article class="detail-item">
          <span>Status</span>
          <strong>{{ statusText(selectedSession.status) }}</strong>
        </article>
        <article class="detail-item">
          <span>User</span>
          <strong>{{ selectedSession.userName || selectedSession.userId || '-' }}</strong>
        </article>
        <article class="detail-item">
          <span>Computer</span>
          <strong>{{ selectedSession.computerName || selectedSession.computerId || '-' }}</strong>
        </article>
        <article class="detail-item">
          <span>Tariff</span>
          <strong>{{ selectedSession.tariffName || selectedSession.tariffId || '-' }}</strong>
        </article>
        <article class="detail-item">
          <span>Boshlangan</span>
          <strong>{{ formatDateTime(selectedSession.startedAt) }}</strong>
        </article>
        <article class="detail-item">
          <span>Tugagan</span>
          <strong>{{ formatDateTime(selectedSession.endedAt) }}</strong>
        </article>
        <article class="detail-item">
          <span>Davomiylik</span>
          <strong>{{ sessionDurationText(selectedSession) }}</strong>
        </article>
        <article class="detail-item">
          <span>Narx</span>
          <strong>{{ sessionCostText(selectedSession) }}</strong>
        </article>
      </div>

      <p class="detail-description" v-if="selectedSession.notes">{{ selectedSession.notes }}</p>
    </article>

    <article class="data-panel">
      <div class="panel-head">
        <h3>API natijasi</h3>
      </div>

      <div class="detail-grid" v-if="lastResult">
        <article class="detail-item">
          <span>So'nggi amal</span>
          <strong>{{ lastAction || '-' }}</strong>
        </article>
        <article class="detail-item">
          <span>Natija</span>
          <strong>{{ lastResult.statusText }}</strong>
        </article>
        <article class="detail-item" v-if="lastResult.id !== null">
          <span>Session ID</span>
          <strong>{{ lastResult.id }}</strong>
        </article>
        <article class="detail-item" v-if="lastResult.status">
          <span>Status</span>
          <strong>{{ statusText(lastResult.status) }}</strong>
        </article>
        <article class="detail-item" v-if="lastResult.count !== null">
          <span>Yozuvlar soni</span>
          <strong>{{ lastResult.count }}</strong>
        </article>
        <article class="detail-item" v-if="lastResult.cost !== null">
          <span>Narx</span>
          <strong>{{ formatMoney(lastResult.cost) }}</strong>
        </article>
      </div>
      <p class="detail-description" v-if="lastResult && lastResult.note">{{ lastResult.note }}</p>
      <div class="empty-box" v-if="!lastResult">Hali API amali bajarilmagan.</div>
    </article>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import sessionsApi from '@/api/sessions'

const sessions = ref([])
const selectedSession = ref(null)
const lastResponse = ref(null)
const lastAction = ref('')
const loading = ref(false)

const filters = reactive({
  status: 'active',
  startDate: '',
  endDate: ''
})

const idForm = reactive({ sessionId: 1 })
const costForm = reactive({ sessionId: 1 })
const endForm = reactive({ sessionId: 1 })

const startForm = reactive({
  userId: 1,
  computerId: 1,
  tariffId: 1,
  notes: ''
})

const moneyFormatter = new Intl.NumberFormat('uz-UZ')

const extractBody = (payload) => payload?.data ?? payload ?? null

const toLooseNumber = (value) => {
  if (value === null || value === undefined) return null

  const direct = Number(value)
  if (Number.isFinite(direct)) return direct

  if (typeof value === 'string') {
    const match = value.match(/-?\d+(\.\d+)?/)
    if (match) {
      const parsed = Number(match[0])
      if (Number.isFinite(parsed)) return parsed
    }
  }

  return null
}

const toPositiveInt = (value) => {
  const numeric = Number(value)
  if (!Number.isInteger(numeric) || numeric <= 0) return null
  return numeric
}

const normalizeStatus = (value) => {
  const status = (value ?? '').toString().trim().toLowerCase()
  if (['active', 'completed', 'cancelled'].includes(status)) {
    return status
  }

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

  const startedAt = session.startedAt ?? session.startTime ?? session.started_at ?? session.createdAt ?? null
  const endedAt = session.endedAt ?? session.endTime ?? session.ended_at ?? null

  const durationMinutes = toLooseNumber(
    session.durationMinutes ?? session.duration_minutes ?? session.duration ?? null
  )

  const totalCost = toLooseNumber(
    session.totalCost ?? session.total_cost ?? session.cost ?? session.amount ?? null
  )

  const currentCost = toLooseNumber(
    session.currentCost ?? session.current_cost ?? null
  )

  const pricePerMinute = toLooseNumber(
    session.pricePerMinute ?? session.price_per_minute ?? null
  )

  const fallbackKey = `session-${Math.random().toString(36).slice(2, 8)}`

  return {
    key: id !== null ? `id-${id}` : fallbackKey,
    id,
    userId: session.userId ?? session.user_id ?? user.id ?? user.userId ?? null,
    userName: session.username ?? session.userName ?? user.username ?? user.fullName ?? null,
    computerId: session.computerId ?? session.computer_id ?? computer.id ?? computer.computerId ?? null,
    computerName: session.computerName ?? computer.name ?? computer.number ?? null,
    tariffId: session.tariffId ?? session.tariff_id ?? tariff.id ?? tariff.tariffId ?? null,
    tariffName: session.tariffName ?? tariff.name ?? null,
    status: normalizeStatus(session.status),
    startedAt,
    endedAt,
    durationMinutes,
    totalCost,
    currentCost,
    pricePerMinute,
    notes: session.notes ?? session.comment ?? null,
    raw: session
  }
}

const extractSessions = (payload) => {
  const body = extractBody(payload)

  if (Array.isArray(body)) {
    return body.map((item) => normalizeSession(item))
  }

  if (!body || typeof body !== 'object') {
    return []
  }

  const candidates = [body.items, body.sessions, body.results, body.rows, body.data]
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.map((item) => normalizeSession(item))
    }
  }

  if (body.session && typeof body.session === 'object') {
    return [normalizeSession(body.session)]
  }

  const one = normalizeSession(body)
  if (one.id !== null || one.userId !== null || one.computerId !== null) {
    return [one]
  }

  return []
}

const dedupeSessions = (list) => {
  const map = new Map()

  list.forEach((item) => {
    const key = item.id !== null ? `id-${item.id}` : item.key
    map.set(key, { ...item, key })
  })

  return Array.from(map.values())
}

const formatDateTime = (value) => {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString('uz-UZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatMoney = (value) => {
  const numeric = toLooseNumber(value)
  if (numeric === null) return '-'
  return `${moneyFormatter.format(Math.round(numeric))} so'm`
}

const sessionDurationText = (session) => {
  const duration = toLooseNumber(
    session?.durationMinutes ?? session?.currentDurationMinutes ?? null
  )
  if (duration === null) return '-'
  return `${Math.max(0, Math.round(duration))} min`
}

const sessionCostText = (session) => {
  const current = toLooseNumber(session?.currentCost)
  if (session?.status === 'active' && current !== null) {
    return formatMoney(current)
  }

  const total = toLooseNumber(session?.totalCost)
  if (total !== null) {
    return formatMoney(total)
  }

  return '-'
}

const stats = computed(() => {
  const total = sessions.value.length
  const active = sessions.value.filter((item) => item.status === 'active').length
  const completed = sessions.value.filter((item) => item.status === 'completed').length
  const cancelled = sessions.value.filter((item) => item.status === 'cancelled').length
  const revenue = sessions.value.reduce((sum, item) => sum + (toLooseNumber(item.totalCost) ?? 0), 0)

  return {
    total,
    active,
    completed,
    cancelled,
    revenue
  }
})

const lastResult = computed(() => {
  const body = extractBody(lastResponse.value)
  if (body === null || body === undefined) {
    return null
  }

  const list = extractSessions(lastResponse.value)
  if (list.length > 1) {
    return {
      statusText: 'Muvaffaqiyatli',
      id: null,
      status: null,
      count: list.length,
      cost: null,
      note: `${list.length} ta sessiya qaytdi.`
    }
  }

  if (typeof body !== 'object') {
    return {
      statusText: String(body),
      id: null,
      status: null,
      count: null,
      cost: null,
      note: null
    }
  }

  const id = body.id ?? body.sessionId ?? body.session_id ?? null
  const status = body.status ?? null
  const countValue = toLooseNumber(body.count ?? body.total ?? body.length)
  const count = countValue === null ? null : Math.max(0, Math.round(countValue))
  const cost = toLooseNumber(body.cost ?? body.totalCost ?? body.total_cost ?? body.amount ?? null)
  const note = body.message ?? body.description ?? null

  return {
    statusText: body.statusText ?? (body.message ? 'Muvaffaqiyatli' : 'Bajarildi'),
    id,
    status,
    count,
    cost,
    note
  }
})

const getErrorMessage = (error) => {
  const payload = error?.response?.data
  if (Array.isArray(payload?.message)) {
    return payload.message.join(', ')
  }

  return payload?.message || payload?.error || error?.message || 'So`rov bajarilmadi'
}

const syncFormsBySession = (session) => {
  if (!session) return

  selectedSession.value = session

  if (session.id !== null) {
    idForm.sessionId = session.id
    costForm.sessionId = session.id
    endForm.sessionId = session.id
  }

  if (session.userId) startForm.userId = session.userId
  if (session.computerId) startForm.computerId = session.computerId
  if (session.tariffId) startForm.tariffId = session.tariffId
}

const selectSession = (session) => {
  syncFormsBySession(session)
}

const clearSelection = () => {
  selectedSession.value = null
}

const applyList = (list) => {
  sessions.value = dedupeSessions(list)

  if (!sessions.value.length) {
    clearSelection()
    return
  }

  const nextSelected =
    sessions.value.find((item) => item.id !== null && item.id === selectedSession.value?.id) ||
    sessions.value[0]

  syncFormsBySession(nextSelected)
}

const upsertSession = (session) => {
  const list = [...sessions.value]
  const index = list.findIndex((item) => item.id !== null && item.id === session.id)

  if (index >= 0) {
    list[index] = { ...list[index], ...session }
  } else {
    list.unshift(session)
  }

  applyList(list)
}

const runWithToast = async (request, message, actionLabel = '') => {
  try {
    const response = await request()
    lastResponse.value = response
    lastAction.value = actionLabel || message || ''
    if (message) ElMessage.success(message)
    return response
  } catch (error) {
    ElMessage.error(getErrorMessage(error))
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
    'Sessiyalar yuklandi',
    'Sessiyalar ro`yxati'
  )
  if (response) {
    applyList(extractSessions(response))
  }
  loading.value = false
}

const runGetActive = async () => {
  loading.value = true
  const response = await runWithToast(
    () => sessionsApi.getActiveSessions(),
    'Faol sessiyalar yuklandi',
    'Faol sessiyalar'
  )
  if (response) {
    applyList(extractSessions(response))
  }
  loading.value = false
}

const resetFilters = async () => {
  filters.status = 'active'
  filters.startDate = ''
  filters.endDate = ''

  await runGetAll()
}

const runGetById = async () => {
  const sessionId = toPositiveInt(idForm.sessionId)
  if (!sessionId) {
    ElMessage.warning('Session ID kiriting')
    return
  }

  const response = await runWithToast(
    () => sessionsApi.getSessionById(sessionId),
    'Sessiya topildi',
    `Session by ID (${sessionId})`
  )
  if (!response) return

  const found = extractSessions(response)[0]
  if (!found) {
    ElMessage.warning('Sessiya topilmadi')
    return
  }

  upsertSession(found)
}

const runGetCost = async () => {
  const sessionId = toPositiveInt(costForm.sessionId)
  if (!sessionId) {
    ElMessage.warning('Session ID kiriting')
    return
  }

  const response = await runWithToast(
    () => sessionsApi.getSessionCost(sessionId),
    'Joriy narx olindi',
    `Session cost (${sessionId})`
  )
  if (!response) return

  const body = extractBody(response) ?? {}
  const cost = toLooseNumber(body.cost ?? body.totalCost ?? body.total_cost ?? null)
  const durationMinutes = toLooseNumber(body.durationMinutes ?? body.duration_minutes ?? null)
  const pricePerMinute = toLooseNumber(body.pricePerMinute ?? body.price_per_minute ?? null)

  const existing = sessions.value.find((item) => item.id === sessionId)
  if (existing) {
    upsertSession({
      ...existing,
      currentCost: cost,
      currentDurationMinutes: durationMinutes,
      pricePerMinute: pricePerMinute ?? existing.pricePerMinute
    })
  }
}

const runStart = async () => {
  const userId = toPositiveInt(startForm.userId)
  const computerId = toPositiveInt(startForm.computerId)
  const tariffId = toPositiveInt(startForm.tariffId)

  if (!userId || !computerId || !tariffId) {
    ElMessage.warning('userId, computerId va tariffId musbat son bo`lishi kerak')
    return
  }

  const payload = {
    userId,
    computerId,
    tariffId
  }

  const notes = startForm.notes?.trim()
  if (notes) {
    payload.notes = notes
  }

  const response = await runWithToast(
    () => sessionsApi.startSession(payload),
    'Sessiya boshlandi',
    `Session start (user ${userId}, computer ${computerId})`
  )
  if (!response) return

  await runGetActive()
}

const runEnd = async () => {
  const sessionId = toPositiveInt(endForm.sessionId)
  if (!sessionId) {
    ElMessage.warning('Session ID kiriting')
    return
  }

  const response = await runWithToast(
    () => sessionsApi.endSession(sessionId),
    'Sessiya tugatildi',
    `Session end (${sessionId})`
  )
  if (!response) return

  await runGetAll()
}

onMounted(async () => {
  await runGetAll()
})
</script>

<style scoped>
.sessions-page {
  display: grid;
  gap: 14px;
}

.hero-panel,
.data-panel {
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

h2,
h3 {
  margin: 4px 0 0;
  color: #f4f9ff;
}

.subtitle,
.panel-head p {
  margin: 8px 0 0;
  color: #a8bfdc;
}

.hero-actions,
.inline-row {
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
}

.btn.primary {
  background: linear-gradient(180deg, rgba(33, 115, 230, 0.75), rgba(24, 72, 151, 0.8));
}

.btn.danger {
  border-color: rgba(255, 131, 131, 0.45);
  color: #ffd5d5;
  background: rgba(124, 38, 38, 0.55);
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
  align-items: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.table-wrap {
  margin-top: 12px;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(133, 191, 255, 0.2);
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  text-align: left;
  padding: 10px 8px;
  border-bottom: 1px solid rgba(136, 195, 255, 0.14);
  color: #bdd1e9;
  font-size: 13px;
  white-space: nowrap;
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
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  border: 1px solid rgba(139, 196, 255, 0.32);
  padding: 4px 10px;
  font-size: 11px;
  line-height: 1;
}

.status-active {
  color: #d4ffe5;
  border-color: rgba(111, 214, 165, 0.5);
  background: rgba(33, 115, 78, 0.35);
}

.status-completed {
  color: #d7ecff;
  border-color: rgba(140, 200, 255, 0.4);
  background: rgba(30, 79, 145, 0.36);
}

.status-cancelled {
  color: #f7d9d9;
  border-color: rgba(214, 130, 130, 0.45);
  background: rgba(126, 48, 48, 0.32);
}

.status-unknown {
  color: #dbe7f5;
  border-color: rgba(188, 206, 229, 0.45);
  background: rgba(73, 88, 110, 0.35);
}

.forms-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.form-card {
  border-radius: 18px;
  border: 1px solid rgba(128, 188, 255, 0.3);
  background: linear-gradient(150deg, rgba(10, 30, 62, 0.74), rgba(8, 21, 44, 0.9));
  padding: 14px;
  display: grid;
  gap: 12px;
}

.form-grid {
  display: grid;
  gap: 10px;
}

.form-grid label {
  display: grid;
  gap: 6px;
}

.form-grid span {
  font-size: 12px;
  color: #a7c1e2;
}

input,
select {
  border-radius: 10px;
  border: 1px solid rgba(128, 188, 255, 0.34);
  background: rgba(11, 33, 69, 0.58);
  color: #eaf4ff;
  padding: 9px 11px;
  outline: none;
}

.selected-box {
  margin-top: 8px;
  border-radius: 12px;
  border: 1px dashed rgba(138, 197, 255, 0.4);
  padding: 10px;
  background: rgba(10, 28, 57, 0.45);
  display: grid;
  gap: 4px;
}

.selected-box p {
  margin: 0;
  color: #9fc2e6;
  font-size: 12px;
}

.selected-box strong {
  color: #fff;
}

.selected-box span {
  color: #bdd4ed;
  font-size: 12px;
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
  padding: 16px;
  text-align: center;
  color: #a9c1e0;
  background: rgba(13, 35, 72, 0.3);
}

@media (max-width: 980px) {
  table {
    display: block;
    overflow-x: auto;
  }
}
</style>
