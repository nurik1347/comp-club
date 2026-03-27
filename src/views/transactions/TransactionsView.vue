<template>
  <section class="page-wrap">
    <article class="panel">
      <div class="title-row">
        <div>
          <h2>Tranzaksiyalar</h2>
          <p>CRUD + full detail: get all, my, by-id, create, update, delete.</p>
        </div>

        <div class="actions">
          <button type="button" class="btn" :disabled="loading" @click="runGetAll">
            {{ loading ? 'Yuklanmoqda...' : 'Get all' }}
          </button>
          <button type="button" class="btn" :disabled="loading" @click="runGetMine">Get my</button>
          <button type="button" class="btn" @click="clearSelection">Clear</button>
        </div>
      </div>

      <div class="filters">
        <input v-model.number="filters.page" type="number" min="1" placeholder="Page" />
        <input v-model.number="filters.limit" type="number" min="1" placeholder="Limit" />
        <select v-model="filters.type">
          <option value="">Type: all</option>
          <option value="deposit">deposit</option>
          <option value="session_payment">session_payment</option>
          <option value="refund">refund</option>
          <option value="manual_adjust">manual_adjust</option>
        </select>
        <input v-model.number="filters.userId" type="number" min="1" placeholder="User ID" />
        <input v-model="filters.startDate" type="date" />
        <input v-model="filters.endDate" type="date" />
        <button type="button" class="btn" :disabled="loading" @click="runGetAll">Apply</button>
        <button type="button" class="btn" :disabled="loading" @click="resetFilters">Reset</button>
      </div>

      <div class="stats">
        <div class="stat">
          <small>Jami</small>
          <strong>{{ stats.total }}</strong>
        </div>
        <div class="stat">
          <small>Deposit</small>
          <strong>{{ formatMoney(stats.deposit) }}</strong>
        </div>
        <div class="stat">
          <small>Session to'lov</small>
          <strong>{{ formatMoney(stats.sessionPayment) }}</strong>
        </div>
        <div class="stat">
          <small>Refund</small>
          <strong>{{ formatMoney(stats.refund) }}</strong>
        </div>
        <div class="stat">
          <small>Net</small>
          <strong>{{ formatMoney(stats.net) }}</strong>
        </div>
      </div>

      <table v-if="rows.length">
        <thead>
          <tr>
            <th>ID</th>
            <th>User</th>
            <th>Type</th>
            <th>Amount</th>
            <th>Balans</th>
            <th>Sessiya/PC</th>
            <th>Yaratilgan</th>
            <th>Izoh</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="tx in rows"
            :key="tx.key"
            :class="{ selected: selected?.key === tx.key }"
            @click="selectRow(tx)"
          >
            <td>{{ tx.id ?? '-' }}</td>
            <td>{{ userText(tx) }}</td>
            <td>{{ typeText(tx.type) }}</td>
            <td :class="amountClass(tx.amount)">{{ amountText(tx.amount) }}</td>
            <td>{{ balanceText(tx) }}</td>
            <td>{{ sessionText(tx) }}</td>
            <td>{{ formatDate(tx.createdAt) }}</td>
            <td>{{ tx.description || '-' }}</td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty-box">Hali ma'lumot yuklanmagan.</div>
    </article>

    <article class="panel grid-three">
      <div class="card">
        <h3>Create Transaction</h3>
        <form class="form-grid" @submit.prevent="runCreate">
          <input v-model.number="createForm.userId" type="number" min="1" placeholder="User ID" />
          <select v-model="createForm.type">
            <option value="deposit">deposit</option>
            <option value="session_payment">session_payment</option>
            <option value="refund">refund</option>
            <option value="manual_adjust">manual_adjust</option>
          </select>
          <input v-model.number="createForm.amount" type="number" placeholder="Amount" />
          <input v-model.number="createForm.sessionId" type="number" min="1" placeholder="Session ID (optional)" />
          <input v-model.trim="createForm.description" type="text" placeholder="Description (optional)" />
          <button type="submit" class="btn primary">Create</button>
        </form>
      </div>

      <div class="card">
        <h3>Update Transaction</h3>
        <form class="form-grid" @submit.prevent="runUpdate">
          <input v-model.number="updateForm.transactionId" type="number" min="1" placeholder="Transaction ID" />
          <input v-model.number="updateForm.userId" type="number" min="1" placeholder="User ID (optional)" />
          <select v-model="updateForm.type">
            <option value="">Type (optional)</option>
            <option value="deposit">deposit</option>
            <option value="session_payment">session_payment</option>
            <option value="refund">refund</option>
            <option value="manual_adjust">manual_adjust</option>
          </select>
          <input v-model.number="updateForm.amount" type="number" placeholder="Amount (optional)" />
          <input v-model.number="updateForm.sessionId" type="number" min="1" placeholder="Session ID (optional)" />
          <input v-model.trim="updateForm.description" type="text" placeholder="Description (optional)" />
          <button type="submit" class="btn primary">Update</button>
        </form>
      </div>

      <div class="card">
        <h3>Actions</h3>
        <div class="inline-row">
          <input v-model.number="idForm.transactionId" type="number" min="1" placeholder="Transaction ID" />
          <button type="button" class="btn" @click="runGetById">By ID</button>
        </div>
        <div class="inline-row">
          <input v-model.number="deleteForm.transactionId" type="number" min="1" placeholder="Transaction ID" />
          <button type="button" class="btn danger" @click="runDelete">Delete</button>
        </div>
        <div class="selected-box" v-if="selected">
          <p>Tanlangan</p>
          <strong>{{ selected.id ?? '-' }} | {{ typeText(selected.type) }}</strong>
          <span>{{ userText(selected) }} | {{ amountText(selected.amount) }}</span>
        </div>
      </div>
    </article>

    <article class="panel" v-if="selected">
      <h3>Transaction Detail</h3>
      <div class="detail-grid">
        <div class="detail-item"><span>ID</span><strong>{{ selected.id ?? '-' }}</strong></div>
        <div class="detail-item"><span>Type</span><strong>{{ typeText(selected.type) }}</strong></div>
        <div class="detail-item"><span>Status</span><strong>{{ selected.status || '-' }}</strong></div>
        <div class="detail-item"><span>Amount</span><strong>{{ amountText(selected.amount) }}</strong></div>
        <div class="detail-item"><span>User</span><strong>{{ userText(selected) }}</strong></div>
        <div class="detail-item"><span>Session</span><strong>{{ selected.sessionId ?? '-' }}</strong></div>
        <div class="detail-item"><span>Computer</span><strong>{{ selected.computerName ?? selected.computerId ?? '-' }}</strong></div>
        <div class="detail-item"><span>Tariff</span><strong>{{ selected.tariffName ?? selected.tariffId ?? '-' }}</strong></div>
        <div class="detail-item"><span>Balance before</span><strong>{{ formatMoney(selected.balanceBefore) }}</strong></div>
        <div class="detail-item"><span>Balance after</span><strong>{{ formatMoney(selected.balanceAfter) }}</strong></div>
        <div class="detail-item"><span>Created by</span><strong>{{ selected.createdByName ?? selected.createdById ?? '-' }}</strong></div>
        <div class="detail-item"><span>Created at</span><strong>{{ formatDate(selected.createdAt) }}</strong></div>
      </div>
      <pre class="json-box">{{ pretty(selected.raw) }}</pre>
    </article>

    <article class="panel">
      <h3>Natija</h3>
      <p class="last-action">{{ lastAction || 'Hali amal bajarilmagan' }}</p>
      <pre class="json-box">{{ pretty(lastResponse) }}</pre>
    </article>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import transactionsApi from '@/api/transactions'

const allowedTypes = ['deposit', 'session_payment', 'refund', 'manual_adjust']
const moneyFormatter = new Intl.NumberFormat('uz-UZ')

const rows = ref([])
const selected = ref(null)
const lastResponse = ref(null)
const lastAction = ref('')
const loading = ref(false)

const filters = reactive({
  page: 1,
  limit: 20,
  type: '',
  userId: null,
  startDate: '',
  endDate: ''
})

const idForm = reactive({ transactionId: 1 })
const deleteForm = reactive({ transactionId: 1 })

const createForm = reactive({
  userId: 1,
  type: 'deposit',
  amount: 50000,
  sessionId: null,
  description: 'Naqd pul qabul qilindi'
})

const updateForm = reactive({
  transactionId: 1,
  userId: null,
  type: '',
  amount: null,
  sessionId: null,
  description: ''
})

const extractBody = (payload) => payload?.data ?? payload ?? null

const toNumber = (value) => {
  if (value === undefined || value === null || value === '') return null
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

const toPositiveInt = (value) => {
  const numeric = Number(value)
  return Number.isInteger(numeric) && numeric > 0 ? numeric : null
}

const hasValue = (value) => {
  if (value === undefined || value === null) return false
  if (typeof value === 'string' && !value.trim()) return false
  return true
}

const normalizeType = (value) => {
  const text = (value ?? '').toString().trim().toLowerCase().replace(/[\s-]+/g, '_')
  if (!text) return 'unknown'

  const map = {
    sessionpayment: 'session_payment',
    sessionpay: 'session_payment',
    manualadjust: 'manual_adjust',
    adjust: 'manual_adjust'
  }

  return map[text] || text
}

const typeText = (value) => {
  const map = {
    deposit: 'Deposit',
    session_payment: 'Session payment',
    refund: 'Refund',
    manual_adjust: 'Manual adjust',
    unknown: 'Noma`lum'
  }

  const normalized = normalizeType(value)
  return map[normalized] || normalized || 'Noma`lum'
}

const normalizeTx = (raw = {}) => {
  const tx = raw?.data ?? raw ?? {}
  const user = tx.user ?? {}
  const session = tx.session ?? {}
  const computer = tx.computer ?? session.computer ?? {}
  const tariff = tx.tariff ?? session.tariff ?? {}
  const createdBy = tx.createdBy ?? tx.admin ?? {}

  const id = tx.id ?? tx.transactionId ?? tx.transaction_id ?? null
  const type = normalizeType(tx.type ?? tx.transactionType ?? tx.transaction_type)
  const amount = toNumber(tx.amount ?? tx.value ?? tx.sum ?? tx.totalCost ?? tx.total_cost)

  const userId = tx.userId ?? tx.user_id ?? user.id ?? user.userId ?? null
  const username = tx.username ?? tx.userName ?? user.username ?? null
  const fullName = tx.fullName ?? tx.userFullName ?? user.fullName ?? null

  const sessionId = tx.sessionId ?? tx.session_id ?? session.id ?? session.sessionId ?? null
  const computerId = tx.computerId ?? tx.computer_id ?? computer.id ?? computer.computerId ?? null
  const computerName = tx.computerName ?? computer.name ?? null
  const tariffId = tx.tariffId ?? tx.tariff_id ?? tariff.id ?? null
  const tariffName = tx.tariffName ?? tariff.name ?? null

  const createdAt = tx.createdAt ?? tx.created_at ?? tx.date ?? tx.timestamp ?? null
  const description = tx.description ?? tx.note ?? tx.comment ?? ''
  const status = tx.status ?? 'completed'

  const fallbackKey = `${type}-${createdAt ?? 'na'}-${userId ?? 'na'}-${amount ?? 'na'}`

  return {
    key: id !== null ? `id-${id}` : fallbackKey,
    id,
    type,
    amount,
    status,
    description,
    userId,
    username,
    fullName,
    sessionId,
    computerId,
    computerName,
    tariffId,
    tariffName,
    balanceBefore: toNumber(tx.balanceBefore ?? tx.balance_before ?? tx.previousBalance),
    balanceAfter: toNumber(tx.balanceAfter ?? tx.balance_after ?? tx.currentBalance),
    createdById: tx.createdById ?? tx.created_by_id ?? createdBy.id ?? null,
    createdByName: tx.createdByName ?? createdBy.username ?? createdBy.fullName ?? null,
    createdAt,
    raw: tx
  }
}

const extractTxRows = (payload) => {
  const body = extractBody(payload)

  if (Array.isArray(body)) return body.map((item) => normalizeTx(item))
  if (!body || typeof body !== 'object') return []

  const candidates = [body.items, body.results, body.rows, body.transactions, body.data]
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.map((item) => normalizeTx(item))
    }
  }

  if (body.transaction && typeof body.transaction === 'object') {
    return [normalizeTx(body.transaction)]
  }

  const one = normalizeTx(body)
  if (one.id !== null || one.userId !== null || one.amount !== null) return [one]
  return []
}

const sortRows = (list) => {
  const withTime = (value) => {
    const time = new Date(value).getTime()
    return Number.isNaN(time) ? 0 : time
  }

  return [...list].sort((a, b) => withTime(b.createdAt) - withTime(a.createdAt))
}

const applyRows = (list) => {
  const deduped = new Map()
  list.forEach((item) => {
    const key = item.id !== null ? `id-${item.id}` : item.key
    deduped.set(key, { ...item, key })
  })

  rows.value = sortRows(Array.from(deduped.values()))

  if (!rows.value.length) {
    selected.value = null
    return
  }

  const same = rows.value.find((item) => item.id !== null && item.id === selected.value?.id)
  selectRow(same || rows.value[0])
}

const upsertRow = (tx) => {
  const next = [...rows.value]
  const index = next.findIndex((item) => (tx.id !== null && item.id === tx.id) || item.key === tx.key)

  if (index >= 0) {
    next[index] = { ...next[index], ...tx }
  } else {
    next.unshift(tx)
  }

  applyRows(next)
}

const selectRow = (tx) => {
  selected.value = tx
  if (!tx) return

  if (tx.id !== null) {
    idForm.transactionId = tx.id
    deleteForm.transactionId = tx.id
    updateForm.transactionId = tx.id
  }

  updateForm.userId = tx.userId ?? null
  updateForm.type = allowedTypes.includes(tx.type) ? tx.type : ''
  updateForm.amount = tx.amount
  updateForm.sessionId = tx.sessionId ?? null
  updateForm.description = tx.description || ''
}

const clearSelection = () => {
  selected.value = null
}

const getErrorMessage = (error) => {
  const payload = error?.response?.data
  if (Array.isArray(payload?.message)) return payload.message.join(', ')
  return payload?.message || payload?.error || error?.message || 'So`rov bajarilmadi'
}

const runWithToast = async (request, message, action = '') => {
  try {
    const response = await request()
    lastResponse.value = response
    lastAction.value = action || message || ''
    if (message) ElMessage.success(message)
    return response
  } catch (error) {
    ElMessage.error(getErrorMessage(error))
    return null
  }
}

const buildParams = () => {
  const params = {
    page: toPositiveInt(filters.page) ?? 1,
    limit: toPositiveInt(filters.limit) ?? 20
  }

  if (allowedTypes.includes(filters.type)) params.type = filters.type

  const userId = toPositiveInt(filters.userId)
  if (userId) params.userId = userId
  if (filters.startDate) params.startDate = filters.startDate
  if (filters.endDate) params.endDate = filters.endDate

  return params
}

const buildCreatePayload = () => {
  const userId = toPositiveInt(createForm.userId)
  if (!userId) return { error: 'userId musbat butun son bo`lishi kerak' }

  const type = normalizeType(createForm.type)
  if (!allowedTypes.includes(type)) return { error: 'type noto`g`ri' }

  const amount = toNumber(createForm.amount)
  if (amount === null || amount === 0) return { error: 'amount 0 bo`lmasligi kerak' }

  const payload = { userId, type, amount }

  if (hasValue(createForm.sessionId)) {
    const sessionId = toPositiveInt(createForm.sessionId)
    if (!sessionId) return { error: 'sessionId musbat butun son bo`lishi kerak' }
    payload.sessionId = sessionId
  }

  const description = createForm.description?.trim()
  if (description) payload.description = description

  return { payload }
}

const buildUpdatePayload = () => {
  const payload = {}

  if (hasValue(updateForm.userId)) {
    const userId = toPositiveInt(updateForm.userId)
    if (!userId) return { error: 'userId musbat butun son bo`lishi kerak' }
    payload.userId = userId
  }

  if (hasValue(updateForm.type)) {
    const type = normalizeType(updateForm.type)
    if (!allowedTypes.includes(type)) return { error: 'type noto`g`ri' }
    payload.type = type
  }

  if (hasValue(updateForm.amount)) {
    const amount = toNumber(updateForm.amount)
    if (amount === null || amount === 0) return { error: 'amount 0 bo`lmasligi kerak' }
    payload.amount = amount
  }

  if (hasValue(updateForm.sessionId)) {
    const sessionId = toPositiveInt(updateForm.sessionId)
    if (!sessionId) return { error: 'sessionId musbat butun son bo`lishi kerak' }
    payload.sessionId = sessionId
  }

  const description = updateForm.description?.trim()
  if (description) payload.description = description

  if (!Object.keys(payload).length) {
    return { error: 'Yangilash uchun kamida bitta maydon kiriting' }
  }

  return { payload }
}

const runGetAll = async () => {
  loading.value = true
  const response = await runWithToast(
    () => transactionsApi.getAllTransactions(buildParams()),
    'Tranzaksiyalar yuklandi',
    'Barcha tranzaksiyalar'
  )
  if (response) {
    applyRows(extractTxRows(response))
  }
  loading.value = false
}

const runGetMine = async () => {
  loading.value = true
  const response = await runWithToast(
    () => transactionsApi.getMyTransactions(buildParams()),
    'Mening tranzaksiyalarim yuklandi',
    'Mening tranzaksiyalarim'
  )
  if (response) {
    applyRows(extractTxRows(response))
  }
  loading.value = false
}

const runGetById = async () => {
  const transactionId = toPositiveInt(idForm.transactionId)
  if (!transactionId) {
    ElMessage.warning('Transaction ID kiriting')
    return
  }

  const response = await runWithToast(
    () => transactionsApi.getTransactionById(transactionId),
    'Tranzaksiya topildi',
    `By ID (${transactionId})`
  )
  if (!response) return

  const found = extractTxRows(response)[0]
  if (!found) {
    ElMessage.warning('Tranzaksiya topilmadi')
    return
  }

  upsertRow(found)
}

const runCreate = async () => {
  const { payload, error } = buildCreatePayload()
  if (error) {
    ElMessage.warning(error)
    return
  }

  const response = await runWithToast(
    () => transactionsApi.createTransaction(payload),
    'Tranzaksiya yaratildi',
    'Create transaction'
  )
  if (!response) return

  await runGetAll()
}

const runUpdate = async () => {
  const transactionId = toPositiveInt(updateForm.transactionId)
  if (!transactionId) {
    ElMessage.warning('Transaction ID kiriting')
    return
  }

  const { payload, error } = buildUpdatePayload()
  if (error) {
    ElMessage.warning(error)
    return
  }

  const response = await runWithToast(
    () => transactionsApi.updateTransaction(transactionId, payload),
    'Tranzaksiya yangilandi',
    `Update transaction (${transactionId})`
  )
  if (!response) return

  await runGetAll()
}

const runDelete = async () => {
  const transactionId = toPositiveInt(deleteForm.transactionId)
  if (!transactionId) {
    ElMessage.warning('Transaction ID kiriting')
    return
  }

  const response = await runWithToast(
    () => transactionsApi.deleteTransaction(transactionId),
    'Tranzaksiya o`chirildi',
    `Delete transaction (${transactionId})`
  )
  if (!response) return

  if (selected.value?.id === transactionId) {
    clearSelection()
  }

  await runGetAll()
}

const resetFilters = async () => {
  filters.page = 1
  filters.limit = 20
  filters.type = ''
  filters.userId = null
  filters.startDate = ''
  filters.endDate = ''

  await runGetAll()
}

const stats = computed(() => {
  const total = rows.value.length
  const sumByType = (type) =>
    rows.value.filter((item) => item.type === type).reduce((sum, item) => sum + (toNumber(item.amount) ?? 0), 0)

  const deposit = sumByType('deposit')
  const sessionPayment = sumByType('session_payment')
  const refund = sumByType('refund')
  const net = rows.value.reduce((sum, item) => sum + (toNumber(item.amount) ?? 0), 0)

  return { total, deposit, sessionPayment, refund, net }
})

const formatMoney = (value) => {
  const numeric = toNumber(value)
  if (numeric === null) return '-'
  return `${moneyFormatter.format(Math.round(numeric))} so'm`
}

const amountText = (value) => {
  const numeric = toNumber(value)
  if (numeric === null) return '-'
  const sign = numeric > 0 ? '+' : ''
  return `${sign}${moneyFormatter.format(Math.round(numeric))} so'm`
}

const amountClass = (value) => {
  const numeric = toNumber(value)
  if (numeric === null || numeric === 0) return 'amount-neutral'
  return numeric > 0 ? 'amount-positive' : 'amount-negative'
}

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString('uz-UZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const userText = (tx) => {
  const name = tx.fullName || tx.username
  if (name && tx.userId) return `${name} (#${tx.userId})`
  if (name) return name
  if (tx.userId) return `#${tx.userId}`
  return '-'
}

const sessionText = (tx) => {
  const left = tx.sessionId ? `S#${tx.sessionId}` : 'S#-'
  const right = tx.computerName || (tx.computerId ? `PC#${tx.computerId}` : 'PC#-')
  return `${left} | ${right}`
}

const balanceText = (tx) => {
  const before = formatMoney(tx.balanceBefore)
  const after = formatMoney(tx.balanceAfter)
  if (before === '-' && after === '-') return '-'
  return `${before} -> ${after}`
}

const pretty = (value) => {
  if (value === null || value === undefined) return 'No data'
  return JSON.stringify(value, null, 2)
}

onMounted(async () => {
  await runGetAll()
})
</script>

<style scoped>
.page-wrap {
  display: grid;
  gap: 14px;
}

.panel {
  border-radius: 18px;
  border: 1px solid rgba(125, 190, 255, 0.28);
  background: linear-gradient(145deg, rgba(8, 20, 44, 0.9), rgba(10, 27, 59, 0.7));
  padding: 18px;
}

.title-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

h2,
h3 {
  margin: 0;
  color: #f4f9ff;
}

p {
  margin: 8px 0 0;
  color: #a8bfdc;
}

.actions,
.filters,
.inline-row {
  margin-top: 10px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.stats {
  margin-top: 10px;
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
}

.stat {
  border-radius: 12px;
  border: 1px solid rgba(128, 188, 255, 0.28);
  background: rgba(8, 30, 66, 0.55);
  padding: 10px;
  display: grid;
  gap: 5px;
}

.stat small {
  color: #9cc1e8;
}

.stat strong {
  color: #fff;
}

.grid-three {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}

.card {
  border-radius: 14px;
  border: 1px solid rgba(128, 188, 255, 0.3);
  background: rgba(10, 29, 60, 0.5);
  padding: 12px;
  display: grid;
  gap: 10px;
}

.form-grid {
  display: grid;
  gap: 8px;
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
  background: linear-gradient(180deg, rgba(33, 115, 230, 0.66), rgba(24, 72, 151, 0.72));
}

.btn.danger {
  border-color: rgba(255, 131, 131, 0.45);
  color: #ffd5d5;
  background: rgba(124, 38, 38, 0.55);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.selected-box {
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

.empty-box {
  margin-top: 14px;
  border: 1px dashed rgba(133, 192, 255, 0.3);
  border-radius: 14px;
  padding: 16px;
  text-align: center;
  color: #a9c1e0;
  background: rgba(13, 35, 72, 0.3);
}

table {
  width: 100%;
  margin-top: 12px;
  border-collapse: collapse;
}

th,
td {
  text-align: left;
  padding: 8px;
  border-bottom: 1px solid rgba(136, 195, 255, 0.14);
  color: #bdd1e9;
  font-size: 13px;
  white-space: nowrap;
}

th {
  color: #95b3d6;
  font-size: 12px;
  text-transform: uppercase;
}

tbody tr {
  cursor: pointer;
}

tbody tr.selected {
  background: rgba(40, 102, 186, 0.35);
}

.detail-grid {
  margin-top: 12px;
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
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
}

.json-box {
  margin: 12px 0 0;
  border-radius: 12px;
  border: 1px solid rgba(133, 191, 255, 0.28);
  background: rgba(7, 20, 42, 0.74);
  padding: 12px;
  font-size: 12px;
  line-height: 1.4;
  color: #c7dcf7;
  max-height: 360px;
  overflow: auto;
}

.last-action {
  margin: 8px 0 0;
  color: #b7cee8;
}

.amount-positive {
  color: #b5ffd3;
}

.amount-negative {
  color: #ffc2c2;
}

.amount-neutral {
  color: #bdd1e9;
}

@media (max-width: 980px) {
  table {
    display: block;
    overflow-x: auto;
  }
}
</style>
