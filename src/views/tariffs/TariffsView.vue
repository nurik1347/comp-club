<template>
  <section class="tariffs-page">
    <article class="hero-panel">
      <div class="hero-head">
        <div>
          <p class="kicker">Tariff Control Center</p>
          <h2>Tariflar boshqaruvi</h2>
          <p class="subtitle">
            Tarif CRUD amallarini bitta oynada boshqaring: create, read, update, delete, toggle va by-id qidiruv.
          </p>
        </div>

        <div class="hero-actions">
          <button type="button" class="btn primary" :disabled="loading" @click="runGetAll">
            {{ loading ? 'Yuklanmoqda...' : 'Barchasini yangilash' }}
          </button>
          <button type="button" class="btn" :disabled="loading" @click="runGetActive">Faqat faollar</button>
          <button type="button" class="btn" @click="clearSelection">Tanlovni tozalash</button>
        </div>
      </div>

      <div class="stat-grid">
        <article class="stat-card">
          <span class="stat-label">Jami tariflar</span>
          <strong>{{ stats.total }}</strong>
        </article>
        <article class="stat-card">
          <span class="stat-label">Faol</span>
          <strong>{{ stats.active }}</strong>
        </article>
        <article class="stat-card">
          <span class="stat-label">Nofaol</span>
          <strong>{{ stats.inactive }}</strong>
        </article>
        <article class="stat-card">
          <span class="stat-label">O'rtacha soat narxi</span>
          <strong>{{ formatMoney(stats.averagePricePerHour) }}</strong>
        </article>
      </div>

      <div class="tariff-chips" v-if="tariffs.length">
        <button
          v-for="tariff in tariffs"
          :key="tariff.key"
          type="button"
          class="tariff-chip"
          :class="{ active: selectedTariff?.key === tariff.key }"
          @click="selectTariff(tariff)"
        >
          <span class="chip-top">
            <strong>{{ tariff.name || 'Nomsiz tarif' }}</strong>
            <small>{{ statusText(tariff.isActive) }}</small>
          </span>
          <span class="chip-price">{{ formatMoney(tariff.pricePerHour) }} so'm/soat</span>
        </button>
      </div>
    </article>

    <article class="data-panel">
      <div class="panel-head">
        <h3>Tariflar jadvali</h3>
        <p>Qatorga bossangiz Update form va boshqaruv ID avtomatik to'ladi.</p>
      </div>

      <div class="table-wrap" v-if="tariffs.length">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nomi</th>
              <th>Soat narxi</th>
              <th>Daqiqa narxi</th>
              <th>Min davomiylik</th>
              <th>Vaqt oralig'i</th>
              <th>Holat</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="tariff in tariffs"
              :key="tariff.key"
              :class="{ selected: selectedTariff?.key === tariff.key }"
              @click="selectTariff(tariff)"
            >
              <td>{{ tariff.id ?? '-' }}</td>
              <td>{{ tariff.name || '-' }}</td>
              <td>{{ formatMoney(tariff.pricePerHour) }}</td>
              <td>{{ formatMoney(tariff.pricePerMinute) }}</td>
              <td>{{ tariff.minDuration ?? '-' }} daqiqa</td>
              <td>{{ timeRangeText(tariff) }}</td>
              <td>
                <span class="status-pill" :class="{ active: tariff.isActive, inactive: !tariff.isActive }">
                  {{ statusText(tariff.isActive) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="empty-box">Hali tarif ma'lumotlari yuklanmagan.</div>
    </article>

    <div class="forms-grid">
      <article class="form-card">
        <h3>Create Tariff</h3>
        <form class="form-grid" @submit.prevent="runCreate">
          <label>
            <span>Nomi</span>
            <input v-model.trim="createForm.name" type="text" placeholder="Standart" />
          </label>

          <div class="double-grid">
            <label>
              <span>Soat narxi (so'm)</span>
              <input v-model.number="createForm.pricePerHour" type="number" min="1" placeholder="6000" />
            </label>
            <label>
              <span>Min davomiylik (daqiqa)</span>
              <input v-model.number="createForm.minDuration" type="number" min="1" placeholder="30" />
            </label>
          </div>

          <div class="double-grid">
            <label>
              <span>Boshlanish (HH:MM)</span>
              <input v-model.trim="createForm.startTime" type="text" placeholder="08:00" />
            </label>
            <label>
              <span>Tugash (HH:MM)</span>
              <input v-model.trim="createForm.endTime" type="text" placeholder="23:00" />
            </label>
          </div>

          <p class="hint">Agar vaqt oralig'i bo'sh qolsa, tarif 24 soat faol bo'ladi.</p>
          <button type="submit" class="btn primary">Tarif yaratish</button>
        </form>
      </article>

      <article class="form-card">
        <h3>Update Tariff</h3>
        <form class="form-grid" @submit.prevent="runUpdate">
          <label>
            <span>Tariff ID</span>
            <input v-model.number="updateForm.tariffId" type="number" min="1" placeholder="1" />
          </label>

          <label>
            <span>Nomi</span>
            <input v-model.trim="updateForm.name" type="text" placeholder="Standart (yangilangan)" />
          </label>

          <div class="double-grid">
            <label>
              <span>Soat narxi (so'm)</span>
              <input v-model.number="updateForm.pricePerHour" type="number" min="1" placeholder="7000" />
            </label>
            <label>
              <span>Min davomiylik (daqiqa)</span>
              <input v-model.number="updateForm.minDuration" type="number" min="1" placeholder="30" />
            </label>
          </div>

          <div class="double-grid">
            <label>
              <span>Boshlanish (HH:MM)</span>
              <input v-model.trim="updateForm.startTime" type="text" placeholder="08:00" />
            </label>
            <label>
              <span>Tugash (HH:MM)</span>
              <input v-model.trim="updateForm.endTime" type="text" placeholder="23:00" />
            </label>
          </div>

          <button type="submit" class="btn primary">Tarifni yangilash</button>
        </form>
      </article>

      <article class="form-card">
        <h3>Get Tariff By ID</h3>
        <div class="inline-row">
          <input v-model.number="idForm.tariffId" type="number" min="1" placeholder="Tariff ID" />
          <button type="button" class="btn" @click="runGetById">Olish</button>
        </div>

        <h3 class="sub-title">Toggle Tariff</h3>
        <div class="inline-row">
          <input v-model.number="toggleForm.tariffId" type="number" min="1" placeholder="Tariff ID" />
          <button type="button" class="btn" @click="runToggle">Toggle</button>
        </div>

        <h3 class="sub-title">Delete Tariff</h3>
        <div class="inline-row">
          <input v-model.number="deleteForm.tariffId" type="number" min="1" placeholder="Tariff ID" />
          <button type="button" class="btn danger" @click="runDelete">Delete</button>
        </div>

        <div class="selected-box" v-if="selectedTariff">
          <p>Tanlangan tarif</p>
          <strong>{{ selectedTariff.name }} (ID: {{ selectedTariff.id ?? '-' }})</strong>
          <span>{{ formatMoney(selectedTariff.pricePerHour) }} so'm/soat</span>
        </div>
      </article>
    </div>

    <article class="data-panel" v-if="selectedTariff">
      <div class="panel-head">
        <h3>Tanlangan tarif detail</h3>
      </div>

      <div class="detail-grid">
        <article class="detail-item">
          <span>ID</span>
          <strong>{{ selectedTariff.id ?? '-' }}</strong>
        </article>
        <article class="detail-item">
          <span>Nomi</span>
          <strong>{{ selectedTariff.name || '-' }}</strong>
        </article>
        <article class="detail-item">
          <span>Soat narxi</span>
          <strong>{{ formatMoney(selectedTariff.pricePerHour) }} so'm</strong>
        </article>
        <article class="detail-item">
          <span>Daqiqa narxi</span>
          <strong>{{ formatMoney(selectedTariff.pricePerMinute) }} so'm</strong>
        </article>
        <article class="detail-item">
          <span>Min davomiylik</span>
          <strong>{{ selectedTariff.minDuration ?? '-' }} daqiqa</strong>
        </article>
        <article class="detail-item">
          <span>Vaqt oralig'i</span>
          <strong>{{ timeRangeText(selectedTariff) }}</strong>
        </article>
        <article class="detail-item">
          <span>Holat</span>
          <strong>{{ statusText(selectedTariff.isActive) }}</strong>
        </article>
      </div>
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
          <span>Tariff ID</span>
          <strong>{{ lastResult.id }}</strong>
        </article>
        <article class="detail-item" v-if="lastResult.name">
          <span>Nomi</span>
          <strong>{{ lastResult.name }}</strong>
        </article>
        <article class="detail-item" v-if="lastResult.isActive !== null">
          <span>Holat</span>
          <strong>{{ statusText(lastResult.isActive) }}</strong>
        </article>
        <article class="detail-item" v-if="lastResult.count !== null">
          <span>Yozuvlar soni</span>
          <strong>{{ lastResult.count }}</strong>
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
import tariffsApi from '@/api/tariffs'

const tariffs = ref([])
const selectedTariff = ref(null)
const lastResponse = ref(null)
const lastAction = ref('')
const loading = ref(false)

const idForm = reactive({ tariffId: 1 })
const toggleForm = reactive({ tariffId: 1 })
const deleteForm = reactive({ tariffId: 1 })

const createForm = reactive({
  name: 'Standart',
  pricePerHour: 6000,
  minDuration: 30,
  startTime: '08:00',
  endTime: '23:00'
})

const updateForm = reactive({
  tariffId: 1,
  name: 'Standart (yangilangan)',
  pricePerHour: 7000,
  minDuration: 30,
  startTime: '08:00',
  endTime: '23:00'
})

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/
const moneyFormatter = new Intl.NumberFormat('uz-UZ')

const extractBody = (payload) => payload?.data ?? payload ?? null

const toNumber = (value, fallback = null) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

const normalizeTime = (value) => {
  const text = (value ?? '').toString().trim()
  return timePattern.test(text) ? text : ''
}

const normalizeActive = (value) => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value > 0

  const text = (value ?? '').toString().trim().toLowerCase()
  if (['true', '1', 'yes', 'active', 'enabled', 'on'].includes(text)) return true
  if (['false', '0', 'no', 'inactive', 'disabled', 'off'].includes(text)) return false

  return false
}

const normalizeTariff = (raw = {}) => {
  const tariff = raw?.data ?? raw ?? {}

  const id = tariff.id ?? tariff.tariffId ?? tariff.tariff_id ?? null
  const name = tariff.name ?? tariff.title ?? ''
  const pricePerHour = toNumber(
    tariff.pricePerHour ?? tariff.price_per_hour ?? tariff.hourPrice ?? tariff.hour_price,
    null
  )

  const rawPricePerMinute = toNumber(
    tariff.pricePerMinute ?? tariff.price_per_minute ?? tariff.minutePrice ?? tariff.minute_price,
    null
  )

  const calculatedPricePerMinute =
    pricePerHour !== null ? Number((pricePerHour / 60).toFixed(2)) : null
  const pricePerMinute = rawPricePerMinute !== null ? rawPricePerMinute : calculatedPricePerMinute

  const minDuration = toNumber(
    tariff.minDuration ?? tariff.min_duration ?? tariff.minimumDuration ?? tariff.minimum_duration,
    null
  )

  const startTime = normalizeTime(tariff.startTime ?? tariff.start_time ?? tariff.fromTime)
  const endTime = normalizeTime(tariff.endTime ?? tariff.end_time ?? tariff.toTime)
  const isActive = normalizeActive(
    tariff.isActive ?? tariff.active ?? tariff.is_active ?? tariff.enabled ?? tariff.status
  )

  const fallbackKey = `${name || 'tariff'}-${Math.random().toString(36).slice(2, 8)}`

  return {
    key: id !== null ? `id-${id}` : fallbackKey,
    id,
    name,
    pricePerHour,
    pricePerMinute,
    minDuration,
    startTime,
    endTime,
    isActive,
    raw: tariff
  }
}

const extractTariffs = (payload) => {
  const body = extractBody(payload)

  if (Array.isArray(body)) {
    return body.map((item) => normalizeTariff(item))
  }

  if (!body || typeof body !== 'object') {
    return []
  }

  const candidates = [body.items, body.results, body.list, body.rows, body.tariffs, body.data]
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.map((item) => normalizeTariff(item))
    }
  }

  const one = normalizeTariff(body)
  if (one.id !== null || one.name || one.pricePerHour !== null) {
    return [one]
  }

  return []
}

const dedupeTariffs = (list) => {
  const map = new Map()

  list.forEach((item) => {
    const key = item.id !== null ? `id-${item.id}` : `name-${item.name || item.key}`
    map.set(key, { ...item, key })
  })

  return Array.from(map.values())
}

const statusText = (isActive) => (isActive ? 'Faol' : 'Nofaol')

const timeRangeText = (tariff) => {
  if (!tariff?.startTime && !tariff?.endTime) {
    return '24 soat'
  }

  if (!tariff?.startTime || !tariff?.endTime) {
    return 'Noaniq vaqt'
  }

  return `${tariff.startTime} - ${tariff.endTime}`
}

const formatMoney = (value) => {
  const numeric = toNumber(value, null)
  if (numeric === null) return '-'
  return moneyFormatter.format(numeric)
}

const stats = computed(() => {
  const total = tariffs.value.length
  const active = tariffs.value.filter((item) => item.isActive).length
  const inactive = total - active

  const withPrice = tariffs.value.filter((item) => item.pricePerHour !== null)
  const averagePricePerHour = withPrice.length
    ? Math.round(withPrice.reduce((sum, item) => sum + item.pricePerHour, 0) / withPrice.length)
    : 0

  return {
    total,
    active,
    inactive,
    averagePricePerHour
  }
})

const toOptionalNumber = (value) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

const lastResult = computed(() => {
  const body = extractBody(lastResponse.value)
  if (body === null || body === undefined) {
    return null
  }

  const list = extractTariffs(lastResponse.value)
  if (list.length > 1) {
    return {
      statusText: 'Muvaffaqiyatli',
      id: null,
      name: null,
      isActive: null,
      count: list.length,
      note: `${list.length} ta tarif qaytdi.`
    }
  }

  if (typeof body !== 'object') {
    return {
      statusText: String(body),
      id: null,
      name: null,
      isActive: null,
      count: null,
      note: null
    }
  }

  const id = body.id ?? body.tariffId ?? body.tariff_id ?? null
  const name = body.name ?? body.title ?? null
  const isActiveRaw = body.isActive ?? body.active ?? body.is_active ?? body.status
  const isActive = isActiveRaw !== undefined ? normalizeActive(isActiveRaw) : null
  const count = toOptionalNumber(body.count ?? body.total ?? body.length)
  const note = body.message ?? body.description ?? null

  return {
    statusText: body.statusText ?? (body.message ? 'Muvaffaqiyatli' : 'Bajarildi'),
    id,
    name,
    isActive,
    count,
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

const syncFormsByTariff = (tariff) => {
  if (!tariff) return

  selectedTariff.value = tariff

  if (tariff.id !== null) {
    idForm.tariffId = tariff.id
    toggleForm.tariffId = tariff.id
    deleteForm.tariffId = tariff.id
    updateForm.tariffId = tariff.id
  }

  updateForm.name = tariff.name || ''
  updateForm.pricePerHour = tariff.pricePerHour ?? updateForm.pricePerHour
  updateForm.minDuration = tariff.minDuration ?? updateForm.minDuration
  updateForm.startTime = tariff.startTime || ''
  updateForm.endTime = tariff.endTime || ''
}

const selectTariff = (tariff) => {
  syncFormsByTariff(tariff)
}

const clearSelection = () => {
  selectedTariff.value = null
}

const applyList = (list) => {
  tariffs.value = dedupeTariffs(list)

  if (!tariffs.value.length) {
    clearSelection()
    return
  }

  const nextSelected =
    tariffs.value.find((item) => item.id !== null && item.id === selectedTariff.value?.id) ||
    tariffs.value[0]

  syncFormsByTariff(nextSelected)
}

const upsertTariff = (tariff) => {
  const list = [...tariffs.value]
  const index = list.findIndex(
    (item) =>
      (tariff.id !== null && item.id === tariff.id) ||
      (tariff.id === null && item.name && item.name === tariff.name)
  )

  if (index >= 0) {
    list[index] = tariff
  } else {
    list.unshift(tariff)
  }

  applyList(list)
}

const buildTariffPayload = (form) => {
  const name = form.name?.toString().trim()
  const pricePerHour = toNumber(form.pricePerHour, null)
  const minDuration = toNumber(form.minDuration, null)
  const startTime = (form.startTime ?? '').toString().trim()
  const endTime = (form.endTime ?? '').toString().trim()

  if (!name) {
    return { error: 'Tarif nomini kiriting' }
  }

  if (pricePerHour === null || pricePerHour <= 0) {
    return { error: 'Soat narxi musbat son bo`lishi kerak' }
  }

  if (minDuration === null || minDuration <= 0) {
    return { error: 'Minimal davomiylik musbat son bo`lishi kerak' }
  }

  const hasStart = Boolean(startTime)
  const hasEnd = Boolean(endTime)

  if (hasStart !== hasEnd) {
    return { error: 'Vaqt oralig`i uchun startTime va endTime ikkalasi ham berilishi kerak' }
  }

  if (hasStart && !timePattern.test(startTime)) {
    return { error: 'startTime formati noto`g`ri. To`g`ri format: HH:MM' }
  }

  if (hasEnd && !timePattern.test(endTime)) {
    return { error: 'endTime formati noto`g`ri. To`g`ri format: HH:MM' }
  }

  const payload = {
    name,
    pricePerHour,
    minDuration: Math.round(minDuration)
  }

  if (hasStart) {
    payload.startTime = startTime
    payload.endTime = endTime
  }

  return { payload }
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

const runGetAll = async (showToast = true) => {
  loading.value = true
  const response = await runWithToast(
    () => tariffsApi.getAllTariffs(),
    showToast ? 'Tariflar yuklandi' : '',
    'Barcha tariflar'
  )
  if (response) {
    applyList(extractTariffs(response))
  }
  loading.value = false
}

const runGetActive = async () => {
  loading.value = true
  const response = await runWithToast(
    () => tariffsApi.getActiveTariffs(),
    'Faol tariflar yuklandi',
    'Faol tariflar'
  )
  if (response) {
    applyList(extractTariffs(response))
  }
  loading.value = false
}

const runGetById = async () => {
  if (!idForm.tariffId) {
    ElMessage.warning('Tariff ID kiriting')
    return
  }

  const response = await runWithToast(
    () => tariffsApi.getTariffById(idForm.tariffId),
    'Tarif topildi',
    `Tariff by ID (${idForm.tariffId})`
  )
  if (!response) return

  const found = extractTariffs(response)[0]
  if (!found) {
    ElMessage.warning('Tarif topilmadi')
    return
  }

  upsertTariff(found)
}

const runCreate = async () => {
  const { payload, error } = buildTariffPayload(createForm)
  if (error) {
    ElMessage.warning(error)
    return
  }

  const response = await runWithToast(() => tariffsApi.createTariff(payload), 'Tarif yaratildi', 'Tarif yaratish')
  if (!response) return

  await runGetAll()
}

const runUpdate = async () => {
  if (!updateForm.tariffId) {
    ElMessage.warning('Tariff ID kiriting')
    return
  }

  const { payload, error } = buildTariffPayload(updateForm)
  if (error) {
    ElMessage.warning(error)
    return
  }

  const response = await runWithToast(
    () => tariffsApi.updateTariff(updateForm.tariffId, payload),
    'Tarif yangilandi',
    `Tarif yangilash (${updateForm.tariffId})`
  )
  if (!response) return

  await runGetAll()
}

const runDelete = async () => {
  if (!deleteForm.tariffId) {
    ElMessage.warning('Tariff ID kiriting')
    return
  }

  const response = await runWithToast(
    () => tariffsApi.deleteTariff(deleteForm.tariffId),
    'Tarif o`chirildi',
    `Tarif o'chirish (${deleteForm.tariffId})`
  )
  if (!response) return

  if (selectedTariff.value?.id === deleteForm.tariffId) {
    clearSelection()
  }

  await runGetAll()
}

const runToggle = async () => {
  if (!toggleForm.tariffId) {
    ElMessage.warning('Tariff ID kiriting')
    return
  }

  const response = await runWithToast(
    () => tariffsApi.toggleTariff(toggleForm.tariffId),
    'Tarif holati almashtirildi',
    `Tarif toggle (${toggleForm.tariffId})`
  )
  if (!response) return

  await runGetAll()
}

onMounted(async () => {
  await runGetAll(false)
})
</script>

<style scoped>
.tariffs-page {
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
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
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
  font-size: 24px;
}

.tariff-chips {
  margin-top: 14px;
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.tariff-chip {
  border-radius: 14px;
  border: 1px solid rgba(133, 191, 255, 0.3);
  background: rgba(10, 31, 64, 0.48);
  color: #e3efff;
  padding: 10px;
  text-align: left;
  display: grid;
  gap: 6px;
  cursor: pointer;
}

.tariff-chip.active {
  border-color: rgba(165, 224, 255, 0.7);
  box-shadow: 0 0 0 1px rgba(170, 228, 255, 0.22) inset;
}

.chip-top {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
}

.chip-top strong {
  font-size: 14px;
}

.chip-top small {
  color: #9dc2e9;
  font-size: 11px;
}

.chip-price {
  color: #c7def8;
  font-size: 12px;
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

.status-pill.active {
  color: #d4ffe5;
  border-color: rgba(111, 214, 165, 0.5);
  background: rgba(33, 115, 78, 0.35);
}

.status-pill.inactive {
  color: #f7d9d9;
  border-color: rgba(214, 130, 130, 0.45);
  background: rgba(126, 48, 48, 0.32);
}

.forms-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
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

.double-grid {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

label {
  display: grid;
  gap: 6px;
}

label span {
  font-size: 12px;
  color: #a7c1e2;
}

input {
  border-radius: 10px;
  border: 1px solid rgba(128, 188, 255, 0.34);
  background: rgba(11, 33, 69, 0.58);
  color: #eaf4ff;
  padding: 9px 11px;
  outline: none;
}

.hint {
  margin: 0;
  color: #9ec0e4;
  font-size: 12px;
}

.sub-title {
  margin-top: 8px;
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

@media (max-width: 760px) {
  .double-grid {
    grid-template-columns: 1fr;
  }
}
</style>
