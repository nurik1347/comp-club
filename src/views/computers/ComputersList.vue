<template>
  <section class="computers-page">
    <!-- Hero Panel -->
    <article class="hero-panel">
      <div class="hero-head">
        <div>
          <p class="kicker">Computer Control Center</p>
          <h2>Kompyuterlar boshqaruvi</h2>
          <p class="subtitle">
            Har bir card ustiga bosing → bron qilish taklifi chiqadi
          </p>
        </div>

        <div class="hero-actions">
          <button type="button" class="btn primary" :disabled="loading" @click="runGetAll">            {{ loading ? 'Yuklanmoqda...' : 'Barchasini yangilash' }}
          </button>
          <button type="button" class="btn" :disabled="loading" @click="runGetAvailable">Faqat bo‘sh</button>
          <button type="button" class="btn" :disabled="loading" @click="runGetMap">Map ma‘lumot</button>
          <button type="button" class="btn" @click="clearSelection">Tanlovni tozalash</button>
        </div>
      </div>

      <!-- Statistikalar -->
      <div class="stat-grid">
        <article class="stat-card">
          <span class="stat-label">Jami kompyuter</span>
          <strong>{{ stats.total }}</strong>
        </article>
        <article class="stat-card">
          <span class="stat-label">Bo‘sh</span>
          <strong>{{ stats.available }}</strong>
        </article>
        <article class="stat-card">
          <span class="stat-label">Band</span>
          <strong>{{ stats.busy }}</strong>
        </article>
        <article class="stat-card">
          <span class="stat-label">Texnik xizmat</span>
          <strong>{{ stats.maintenance }}</strong>
        </article>
        <article class="stat-card">
          <span class="stat-label">Offline</span>
          <strong>{{ stats.offline }}</strong>
        </article>
        <article class="stat-card">
          <span class="stat-label">Zonalar soni</span>
          <strong>{{ stats.zones }}</strong>
        </article>
      </div>
    </article>

    <!-- Kompyuterlar ro‘yxati (cardlar) -->
    <article class="data-panel">
      <div class="panel-head">
        <h3>Kompyuterlar ro‘yxati</h3>
        <p>Card ustiga bosing → bron qilish mumkin</p>
      </div>

      <div class="cards-grid" v-if="computers.length">
        <button
          v-for="computer in computers"
          :key="computer.key"
          type="button"
          class="computer-card"
          :class="[`status-${computer.status}`, { selected: selectedComputer?.key === computer.key }]"
          @click="handleCardClick(computer)"
        >
          <div class="card-top">
            <div>
              <strong>{{ computer.name || `PC-${computer.number || '-'}` }}</strong>
              <p>ID: {{ computer.id ?? '-' }} | № {{ computer.number ?? '-' }}</p>
            </div>
            <span class="status-badge">{{ statusText(computer.status) }}</span>
          </div>

          <div class="meta-grid">
            <div>
              <span>Zona</span>
              <strong>{{ computer.zoneName || '-' }}</strong>
            </div>
            <div>
              <span>IP manzil</span>
              <strong>{{ computer.ipAddress || '-' }}</strong>
            </div>
          </div>

          <div class="spec-tags">
            <span class="spec-tag" v-if="computer.specs.cpu">{{ computer.specs.cpu }}</span>
            <span class="spec-tag" v-if="computer.specs.ram">{{ computer.specs.ram }}</span>
            <span class="spec-tag" v-if="computer.specs.gpu">{{ computer.specs.gpu }}</span>
            <span v-else class="spec-tag muted">Specs kiritilmagan</span>
          </div>
        </button>
      </div>

      <div v-else class="empty-box">Hali ma‘lumot yuklanmagan.</div>
    </article>

    <!-- Formalar (Create / Update / Delete / Status) -->
    <div class="forms-grid">
      <!-- Create Form -->
      <article class="form-card">
        <h3>Yangi kompyuter qo‘shish</h3>
        <form class="form-grid" @submit.prevent="runCreate">
          <label><span>Number</span><input v-model.number="createForm.number" type="number" /></label>
          <label><span>Name</span><input v-model.trim="createForm.name" type="text" /></label>
          <label><span>Zone ID</span><input v-model.number="createForm.zoneId" type="number" /></label>
          <label><span>IP manzil</span><input v-model.trim="createForm.ipAddress" type="text" /></label>
          <div class="triple-grid">
            <label><span>CPU</span><input class="input-xarekteristik" v-model.trim="createForm.cpu" type="text" /></label>
            <label><span>RAM</span><input class="input-xarekteristik" v-model.trim="createForm.ram" type="text" /></label>
            <label><span>GPU</span><input class="input-xarekteristik" v-model.trim="createForm.gpu" type="text" /></label>
          </div>
          <button type="submit" class="btn primary">Kompyuter yaratish</button>
        </form>
      </article>

      <!-- Update + Status -->
      <article class="form-card">
        <h3>Kompyuterni yangilash</h3>
        <form class="form-grid" @submit.prevent="runUpdate">
          <label><span>Computer ID</span><input v-model.number="updateForm.computerId" type="number" /></label>
          <label><span>Name</span><input v-model.trim="updateForm.name" type="text" /></label>
          <label><span>Zone ID</span><input v-model.number="updateForm.zoneId" type="number" /></label>
          <label><span>IP manzil</span><input v-model.trim="updateForm.ipAddress" type="text" /></label>
          <button type="submit" class="btn primary">Yangilash</button>
        </form>

        <h3 class="sub-title">Status o‘zgartirish</h3>
        <div class="inline-row">
          <input v-model.number="statusForm.computerId" type="number" placeholder="ID" />
          <select v-model="statusForm.status">
            <option value="available">available</option>
            <option value="busy">busy</option>
            <option value="maintenance">maintenance</option>
            <option value="offline">offline</option>
          </select>
          <button type="button" class="btn" @click="runStatusUpdate">Yuborish</button>
        </div>
      </article>

      <!-- Get By ID + Delete -->
      <article class="form-card">
        <h3>Get By ID</h3>
        <div class="inline-row">
          <input v-model.number="idForm.computerId" type="number" placeholder="Computer ID" />
          <button type="button" class="btn" @click="runGetById">Olish</button>
        </div>

        <h3 class="sub-title">O‘chirish</h3>
        <div class="inline-row">
          <input v-model.number="deleteForm.computerId" type="number" placeholder="Computer ID" />
          <button type="button" class="btn danger" @click="runDelete">Delete</button>
        </div>

        <div class="selected-box" v-if="selectedComputer">
          <p>Tanlangan kompyuter</p>
          <strong>{{ selectedComputer.name || 'Nomsiz' }}</strong>
          <span>ID: {{ selectedComputer.id }} | Status: {{ statusText(selectedComputer.status) }}</span>
        </div>
      </article>
    </div>

    <!-- Tanlangan kompyuter detallari -->
    <article class="data-panel" v-if="selectedComputer">
      <div class="panel-head"><h3>Tanlangan kompyuter</h3></div>
      <div class="detail-grid">
        <article class="detail-item"><span>ID</span><strong>{{ selectedComputer.id }}</strong></article>
        <article class="detail-item"><span>Nomi</span><strong>{{ selectedComputer.name }}</strong></article>
        <article class="detail-item"><span>Raqam</span><strong>{{ selectedComputer.number }}</strong></article>
        <article class="detail-item"><span>Status</span><strong>{{ statusText(selectedComputer.status) }}</strong></article>
        <article class="detail-item"><span>Zona</span><strong>{{ selectedComputer.zoneName }}</strong></article>
        <article class="detail-item"><span>IP</span><strong>{{ selectedComputer.ipAddress }}</strong></article>
      </div>

      <div class="spec-box">
        <p>Texnik xususiyatlar</p>
        <div class="spec-tags">
          <span class="spec-tag" v-if="selectedComputer.specs.cpu">CPU: {{ selectedComputer.specs.cpu }}</span>
          <span class="spec-tag" v-if="selectedComputer.specs.ram">RAM: {{ selectedComputer.specs.ram }}</span>
          <span class="spec-tag" v-if="selectedComputer.specs.gpu">GPU: {{ selectedComputer.specs.gpu }}</span>
        </div>
      </div>
    </article>

    <!-- API natijasi -->
    <!-- <article class="data-panel">
      <div class="panel-head"><h3>API natijasi</h3></div>
      <pre class="json-box">{{ pretty(lastResponse) }}</pre>
    </article> -->
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import computersApi from '@/api/computers'
import bookingsApi from '@/api/bookings'

// ==================== STATE ====================
const computers = ref([])
const selectedComputer = ref(null)
const lastResponse = ref(null)
const lastAction = ref('')
const loading = ref(false)

// ==================== FORMLAR ====================
const idForm = reactive({ computerId: 1 })
const deleteForm = reactive({ computerId: 1 })
const statusForm = reactive({ computerId: 1, status: 'maintenance' })

const createForm = reactive({
  number: 1,
  name: 'PC-01',
  zoneId: 1,
  ipAddress: '192.168.1.101',
  cpu: 'Intel i5-12400F',
  ram: '16GB',
  gpu: 'RTX 3060'
})

const updateForm = reactive({
  computerId: 1,
  name: 'PC-01 VIP',
  zoneId: 1,
  ipAddress: '192.168.1.101'
})

// ==================== YORDAMCHI FUNKSIYALAR ====================

const pretty = (data) => {
  if (data === null || data === undefined) return 'Ma\'lumot yo\'q'
  try {
    return JSON.stringify(data, null, 2)
  } catch (error) {
    return String(data)
  }
}

// FIX: Statusni to'g'ri normalize qilish
const normalizeStatus = (value) => {
  if (!value) return 'unknown'
  
  const status = String(value).toString().trim().toLowerCase()
  
  // API dan kelishi mumkin bo'lgan barcha variantlar
  if (status === 'available' || status === 'free' || status === 'bo\'sh' || status === 'bosh') {
    return 'available'
  }
  if (status === 'busy' || status === 'occupied' || status === 'band' || status === 'ishlatilmoqda') {
    return 'busy'
  }
  if (status === 'maintenance' || status === 'repair' || status === 'texnik' || status === 'xizmat') {
    return 'maintenance'
  }
  if (status === 'offline' || status === 'off' || status === 'o\'chiq' || status === 'disabled') {
    return 'offline'
  }
  
  console.warn('Noma\'lum status:', value)
  return 'unknown'
}

const statusText = (status) => {
  const normalized = normalizeStatus(status)
  const map = {
    available: 'Bo\'sh',
    busy: 'Band',
    maintenance: 'Texnik xizmat',
    offline: 'Offline',
    unknown: 'Noma\'lum'
  }
  return map[normalized] || status || 'Noma\'lum'
}

const toNumber = (value, fallback = null) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

const toOptionalNumber = (value) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

const extractBody = (payload) => payload?.data ?? payload ?? null

// FIX: Kompyuterni to'g'ri normalize qilish
const normalizeComputer = (raw = {}, zoneFallback = null) => {
  // API dan kelgan ma'lumotni to'g'ri parse qilish
  const computer = raw?.data ?? raw ?? {}
  
  const zoneSource = computer.zone ?? zoneFallback ?? {}
  const specs = computer.specs ?? {}

  // ID ni olish
  const id = computer.id ?? computer.computerId ?? computer.computer_id ?? null
  
  // Number ni olish
  const number = toNumber(computer.number ?? computer.pcNumber ?? computer.pc_number, null)
  
  // Zone ID ni olish
  const zoneId = computer.zoneId ?? computer.zone_id ?? zoneSource.id ?? zoneSource.zoneId ?? null
  
  // Zone nomini olish
  const zoneName = computer.zoneName ??
    computer.zone_name ??
    zoneSource.name ??
    zoneSource.zoneName ??
    (zoneId !== null ? `Zone ${zoneId}` : '')
  
  // FIX: Statusni to'g'ri olish - bu eng muhim qism!
  let status = 'unknown'
  
  // API dan statusni olishning turli usullari
  if (computer.status !== undefined && computer.status !== null) {
    status = computer.status
  } else if (computer.computerStatus !== undefined && computer.computerStatus !== null) {
    status = computer.computerStatus
  } else if (computer.state !== undefined && computer.state !== null) {
    status = computer.state
  }
  
  // Agar status hali ham topilmagan bo'lsa, computer obyektidagi barcha kalitlarni tekshir
  if (status === 'unknown') {
    const possibleStatusKeys = ['status', 'computerStatus', 'state', 'currentStatus', 'condition']
    for (const key of possibleStatusKeys) {
      if (computer[key] && typeof computer[key] === 'string') {
        status = computer[key]
        break
      }
    }
  }
  
  // Agar status string bo'lmasa
  if (typeof status !== 'string') {
    status = String(status)
  }
  
  // Statusni normalize qilish
  const normalizedStatus = normalizeStatus(status)
  
  // Debug uchun (agar status 'available' bo'lsa va aslida 'busy' bo'lishi kerak bo'lsa)
  if (normalizedStatus === 'available' && computer.activeSession) {
    console.warn(`Kompyuter ID ${id} da activeSession bor, lekin status available. Force -> busy`)
    // Agar active session mavjud bo'lsa, status busy bo'lishi kerak
    return normalizeComputer({ ...computer, status: 'busy' }, zoneFallback)
  }

  const normalized = {
    key: id !== null ? `id-${id}` : `num-${number ?? Math.random().toString(36).slice(2)}`,
    id,
    number,
    name: computer.name ?? computer.computerName ?? computer.computer_name ?? '',
    zoneId,
    zoneName,
    status: normalizedStatus,
    ipAddress: computer.ipAddress ?? computer.ip ?? computer.ip_address ?? '',
    specs: {
      cpu: specs.cpu ?? computer.cpu ?? '',
      ram: specs.ram ?? computer.ram ?? '',
      gpu: specs.gpu ?? computer.gpu ?? ''
    },
    activeSession: computer.activeSession ?? computer.currentSession ?? computer.session ?? null,
    raw: computer
  }

  if (!normalized.name && normalized.number !== null) {
    normalized.name = `PC-${String(normalized.number).padStart(2, '0')}`
  }

  return normalized
}

const collectZoneComputers = (zones) =>
  zones.flatMap((zone) => {
    const list = zone?.computers
    if (!Array.isArray(list)) return []
    return list.map((computer) => normalizeComputer(computer, zone))
  })

const extractComputers = (payload) => {
  const body = extractBody(payload)
  
  console.log('Extracting computers from payload:', body)
  
  if (Array.isArray(body)) {
    console.log('Body is array, length:', body.length)
    return body.map((item) => normalizeComputer(item))
  }
  
  if (!body || typeof body !== 'object') {
    console.warn('Body is not an object:', body)
    return []
  }

  const candidates = [body.items, body.results, body.list, body.rows, body.computers, body.data, body.map]
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      console.log('Found candidate array, length:', candidate.length)
      return candidate.map((item) => normalizeComputer(item))
    }
  }

  if (Array.isArray(body.zones)) {
    console.log('Found zones array')
    return collectZoneComputers(body.zones)
  }

  const one = normalizeComputer(body)
  if (one.id !== null || one.number !== null || one.name) {
    console.log('Single computer found:', one)
    return [one]
  }

  console.warn('No computers extracted from payload')
  return []
}

const dedupeComputers = (list) => {
  const map = new Map()
  list.forEach((computer) => {
    const key = computer.id !== null ? `id-${computer.id}` : `num-${computer.number}`
    if (map.has(key)) {
      console.warn(`Duplicate computer found: ${key}`)
    }
    map.set(key, { ...computer, key })
  })
  return Array.from(map.values())
}

// ==================== COMPUTED ====================
const stats = computed(() => {
  const total = computers.value.length
  const available = computers.value.filter((item) => item.status === 'available').length
  const busy = computers.value.filter((item) => item.status === 'busy').length
  const maintenance = computers.value.filter((item) => item.status === 'maintenance').length
  const offline = computers.value.filter((item) => item.status === 'offline').length
  const zones = new Set(
    computers.value
      .map((item) => item.zoneName || item.zoneId)
      .filter((value) => value !== null && value !== undefined && value !== '')
  ).size
  
  console.log('Stats:', { total, available, busy, maintenance, offline })
  
  return { total, available, busy, maintenance, offline, zones }
})

const lastResult = computed(() => {
  const body = extractBody(lastResponse.value)
  if (body === null || body === undefined) return null

  const list = extractComputers(lastResponse.value)
  if (list.length > 1) {
    return {
      statusText: 'Muvaffaqiyatli',
      id: null,
      name: null,
      status: null,
      count: list.length,
      note: `${list.length} ta kompyuter ma\`lumoti qaytdi.`
    }
  }

  if (typeof body !== 'object') {
    return { statusText: String(body), id: null, name: null, status: null, count: null, note: null }
  }

  const id = body.id ?? body.computerId ?? body.computer_id ?? null
  const name = body.name ?? body.computerName ?? body.computer_name ?? null
  const status = body.status ?? body.computerStatus ?? null
  const count = toOptionalNumber(body.count ?? body.total ?? body.length)
  const note = body.message ?? body.description ?? null

  return {
    statusText: body.statusText ?? (body.message ? 'Muvaffaqiyatli' : 'Bajarildi'),
    id,
    name,
    status,
    count,
    note
  }
})

// ==================== SELECTION ====================
const syncFormsByComputer = (computer) => {
  if (!computer) return
  selectedComputer.value = computer

  if (computer.id !== null) {
    idForm.computerId = computer.id
    deleteForm.computerId = computer.id
    statusForm.computerId = computer.id
    updateForm.computerId = computer.id
  }

  updateForm.name = computer.name || ''
  updateForm.zoneId = computer.zoneId ?? updateForm.zoneId
  updateForm.ipAddress = computer.ipAddress || ''
  statusForm.status = normalizeStatus(computer.status)
}

const handleCardClick = async (computer) => {
  syncFormsByComputer(computer)

  // Agar "available" bo'lsa bron so'rash
  if (computer.status === 'available') {
    try {
      await ElMessageBox.confirm(
        `Kompyuter: ${computer.name || `PC-${computer.number}`}\n\n2 soatlik bron qilinsinmi?`,
        'Bron yaratish',
        { confirmButtonText: 'Ha, bron qil', cancelButtonText: 'Bekor qil', type: 'info' }
      )

      const now = new Date()
      const until = new Date(now.getTime() + 2 * 60 * 60 * 1000)

      await bookingsApi.createBooking({
        computerId: computer.id,
        bookedFrom: now.toISOString(),
        bookedUntil: until.toISOString()
      })

      ElMessage.success('Bron muvaffaqiyatli yaratildi!')
      await runGetAll()
    } catch (err) {
      if (err !== 'cancel') console.error(err)
    }
  } else if (computer.status === 'busy') {
    ElMessage.info('Bu kompyuter hozirda band')
  } else if (computer.status === 'maintenance') {
    ElMessage.warning('Bu kompyuter texnik xizmatda')
  } else if (computer.status === 'offline') {
    ElMessage.error('Bu kompyuter offline holatda')
  }
}

const clearSelection = () => {
  selectedComputer.value = null
}

const applyList = (list) => {
  computers.value = dedupeComputers(list)
  
  console.log('Applied computers list:', computers.value.map(c => ({ id: c.id, name: c.name, status: c.status })))
  
  if (!computers.value.length) {
    clearSelection()
    return
  }
  const current = selectedComputer.value
  const next =
    computers.value.find((item) => item.id !== null && item.id === current?.id) ||
    computers.value.find((item) => item.number !== null && item.number === current?.number) ||
    computers.value[0]
  syncFormsByComputer(next)
}

const upsertComputer = (computer) => {
  const list = [...computers.value]
  const index = list.findIndex(
    (item) =>
      (computer.id !== null && item.id === computer.id) ||
      (computer.id === null && computer.number !== null && item.number === computer.number)
  )
  if (index >= 0) list[index] = computer
  else list.unshift(computer)
  applyList(list)
}

// ==================== API SO'ROVLARI ====================
const runWithToast = async (request, message, actionLabel = '') => {
  try {
    const response = await request()
    lastResponse.value = response
    lastAction.value = actionLabel || message || ''
    if (message) ElMessage.success(message)
    return response
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || error?.message || `So\`rov bajarilmadi`)
    return null
  }
}

const runGetAll = async () => {
  loading.value = true
  const response = await runWithToast(
    () => computersApi.getAllComputers(),
    'Kompyuterlar yuklandi',
    'Barcha kompyuterlar'
  )
  if (response) {
    console.log('API Response for getAllComputers:', response)
    const extracted = extractComputers(response)
    console.log('Extracted computers:', extracted)
    applyList(extracted)
  }
  loading.value = false
}

const runGetAvailable = async () => {
  loading.value = true
  const response = await runWithToast(
    () => computersApi.getAvailableComputers(),
    `Bo\`sh kompyuterlar yuklandi`,
    'Available kompyuterlar'
  )
  if (response) applyList(extractComputers(response))
  loading.value = false
}

const runGetMap = async () => {
  loading.value = true
  const response = await runWithToast(
    () => computersApi.getComputersMap(),
    `Map ma\`lumotlari yuklandi`,
    'Computer map'
  )
  if (response) applyList(extractComputers(response))
  loading.value = false
}

const runGetById = async () => {
  if (!idForm.computerId) {
    ElMessage.warning('Computer ID kiriting')
    return
  }
  const response = await runWithToast(
    () => computersApi.getComputerById(idForm.computerId),
    'Kompyuter topildi',
    `Computer by ID (${idForm.computerId})`
  )
  if (!response) return
  const found = extractComputers(response)[0]
  if (!found) {
    ElMessage.warning('Kompyuter topilmadi')
    return
  }
  upsertComputer(found)
}

const buildSpecs = (source) => {
  const specs = {
    cpu: source.cpu?.trim() || '',
    ram: source.ram?.trim() || '',
    gpu: source.gpu?.trim() || ''
  }
  if (!specs.cpu && !specs.ram && !specs.gpu) return undefined
  return specs
}

const runCreate = async () => {
  const payload = {
    number: Number(createForm.number),
    name: createForm.name?.trim(),
    zoneId: Number(createForm.zoneId),
    ipAddress: createForm.ipAddress?.trim(),
    specs: buildSpecs(createForm)
  }
  const response = await runWithToast(
    () => computersApi.createComputer(payload),
    'Kompyuter yaratildi',
    'Kompyuter yaratish'
  )
  if (!response) return
  await runGetAll()
}

const runUpdate = async () => {
  if (!updateForm.computerId) {
    ElMessage.warning('Computer ID kiriting')
    return
  }
  const payload = {
    name: updateForm.name?.trim(),
    zoneId: Number(updateForm.zoneId),
    ipAddress: updateForm.ipAddress?.trim()
  }
  const response = await runWithToast(
    () => computersApi.updateComputer(updateForm.computerId, payload),
    'Kompyuter yangilandi',
    `Kompyuter yangilash (${updateForm.computerId})`
  )
  if (!response) return
  await runGetAll()
}

const runDelete = async () => {
  if (!deleteForm.computerId) {
    ElMessage.warning('Computer ID kiriting')
    return
  }
  const response = await runWithToast(
    () => computersApi.deleteComputer(deleteForm.computerId),
    `Kompyuter o\`chirildi`,
    `Kompyuter o'chirish (${deleteForm.computerId})`
  )
  if (!response) return
  if (selectedComputer.value?.id === deleteForm.computerId) clearSelection()
  await runGetAll()
}

const runStatusUpdate = async () => {
  if (!statusForm.computerId) {
    ElMessage.warning('Computer ID kiriting')
    return
  }
  const response = await runWithToast(
    () => computersApi.updateComputerStatus(statusForm.computerId, statusForm.status),
    'Status yangilandi',
    `Status update (${statusForm.computerId})`
  )
  if (!response) return
  await runGetAll()
}

// ==================== LIFECYCLE ====================
onMounted(() => runGetAll())
</script>

<style scoped>
.input-xarekteristik {
  width: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}
computers-page {
  display: grid;
  gap: 16px;
  padding: 20px;
}

.hero-panel,
.data-panel {
  border-radius: 20px;
  border: 1px solid rgba(125, 190, 255, 0.3);
  background: linear-gradient(145deg, rgba(8, 20, 44, 0.92), rgba(10, 27, 59, 0.75));
  padding: 20px;
}

.computers-page {
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
  font-size: 24px;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.cards-grid {
  margin-top: 12px;
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}

.computer-card {
  border-radius: 16px;
  border: 1px solid rgba(128, 188, 255, 0.3);
  background: linear-gradient(150deg, rgba(10, 30, 62, 0.74), rgba(8, 21, 44, 0.9));
  padding: 12px;
  display: grid;
  gap: 10px;
  text-align: left;
  color: #d9e9ff;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.computer-card:hover {
  transform: translateY(-2px);
  border-color: rgba(160, 217, 255, 0.66);
}

.computer-card.selected {
  box-shadow: 0 0 0 1px rgba(170, 224, 255, 0.24) inset;
  border-color: rgba(167, 226, 255, 0.7);
}

.status-available {
  border-color: rgba(118, 226, 180, 0.4);
}

.status-busy {
  border-color: rgba(255, 186, 120, 0.42);
}

.status-maintenance {
  border-color: rgba(255, 152, 152, 0.42);
}

.status-offline {
  border-color: rgba(158, 172, 191, 0.42);
}

.card-top {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.card-top strong {
  color: #fff;
  font-size: 15px;
}

.card-top p {
  margin: 4px 0 0;
  color: #9fc2e6;
  font-size: 12px;
}

.status-badge {
  border-radius: 999px;
  border: 1px solid rgba(140, 200, 255, 0.35);
  background: rgba(16, 44, 87, 0.58);
  color: #d7ecff;
  font-size: 11px;
  line-height: 1;
  padding: 7px 9px;
  align-self: flex-start;
}

.meta-grid {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.meta-grid div {
  border-radius: 10px;
  border: 1px solid rgba(133, 191, 255, 0.22);
  background: rgba(10, 28, 57, 0.5);
  padding: 8px;
  display: grid;
  gap: 4px;
}

.meta-grid span {
  color: #9ec0e4;
  font-size: 12px;
}

.meta-grid strong {
  color: #fff;
  font-size: 13px;
}

.spec-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.spec-tag {
  border-radius: 999px;
  border: 1px solid rgba(133, 191, 255, 0.3);
  background: rgba(11, 33, 68, 0.55);
  padding: 6px 10px;
  color: #d8e8fb;
  font-size: 12px;
}

.spec-tag.muted {
  color: #9bb4d2;
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

.triple-grid {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

label {
  display: grid;
  gap: 6px;
}

label span {
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

.spec-box {
  margin-top: 12px;
  border-radius: 12px;
  border: 1px solid rgba(133, 191, 255, 0.24);
  background: rgba(9, 28, 57, 0.4);
  padding: 10px;
}

.spec-box p {
  margin: 0 0 8px;
  color: #9ec0e4;
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

@media (max-width: 920px) {

  .triple-grid,
  .meta-grid {
    grid-template-columns: 1fr;
  }
}
</style>
