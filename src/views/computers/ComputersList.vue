<template>
  <section class="computers-page">
    <!-- Hero Panel -->
    <article class="hero-panel">
      <div class="hero-head">
        <div>
          <p class="kicker">Computer Control Center</p>
          <h2>Kompyuterlar boshqaruvi</h2>
          <p class="subtitle">
            Har bir card ustiga bosing → bron qilish yoki sessiya yoqish
          </p>
        </div>

        <div class="hero-actions">
          <button type="button" class="btn primary" :disabled="loading" @click="runGetAll">
            {{ loading ? 'Yuklanmoqda...' : 'Barchasini yangilash' }}
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
        <p>Card ustiga bosing → bron qilish yoki sessiya yoqish</p>
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
            <label><span>CPU</span><input class="input-xarakteristik" v-model.trim="createForm.cpu" type="text" /></label>
            <label><span>RAM</span><input class="input-xarakteristik" v-model.trim="createForm.ram" type="text" /></label>
            <label><span>GPU</span><input class="input-xarakteristik" v-model.trim="createForm.gpu" type="text" /></label>
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


    <Teleport to="body">
      <div v-if="showSessionModal" class="modal-overlay" @click.self="closeSessionModal">
        <div class="modal-container">
          <div class="modal-header">
            <h3>▶️ Sessiya yoqish</h3>
            <button class="close-btn" @click="closeSessionModal">✕</button>
          </div>
          
          <div class="modal-body">
            <div class="computer-info">
              <strong>{{ selectedComputerForSession?.name || `PC-${selectedComputerForSession?.number}` }}</strong>
              <span>Zona: {{ selectedComputerForSession?.zoneName || '-' }}</span>
              <span>ID: {{ selectedComputerForSession?.id }}</span>
            </div>

            <div class="form-group">
              <label>👤 Foydalanuvchi ID</label>
              <input 
                v-model.number="sessionUserId" 
                type="number" 
                placeholder="User ID (masalan: 1, 2, 3...)"
                class="modal-input"
                min="1"
              />
              <small class="input-hint">⚠️ Agar user ID kiritilmasa, avtomatik yangi foydalanuvchi yaratiladi</small>
            </div>

            <div class="form-group">
              <label>💰 Tarif</label>
              <select v-model="sessionTariff" class="modal-select">
                <option v-for="t in availableTariffs" :key="t.id" :value="t">
                  {{ t.name }} - {{ formatMoney(t.pricePerHour || t.pricePerMinute * 60) }}/soat
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>⏱️ Davomiylik (daqiqa)</label>
              <div class="duration-control">
                <button type="button" class="duration-btn" @click="sessionDuration = Math.max(15, sessionDuration - 15)">-15</button>
                <input v-model.number="sessionDuration" type="number" min="15" step="15" class="duration-input" />
                <button type="button" class="duration-btn" @click="sessionDuration = Math.min(480, sessionDuration + 15)">+15</button>
              </div>
              <div class="duration-presets">
                <span class="preset" @click="sessionDuration = 30">30 min</span>
                <span class="preset" @click="sessionDuration = 60">1 soat</span>
                <span class="preset" @click="sessionDuration = 120">2 soat</span>
                <span class="preset" @click="sessionDuration = 180">3 soat</span>
                <span class="preset" @click="sessionDuration = 240">4 soat</span>
              </div>
            </div>

            <div class="price-info" v-if="sessionTariff">
              <span>💰 Umumiy narx:</span>
              <strong>{{ formatMoney(calculatePrice()) }}</strong>
            </div>
            <div class="price-info" v-else>
              <span>⚠️ Tarif mavjud emas</span>
              <strong>0 so'm</strong>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn cancel" @click="closeSessionModal">Bekor qilish</button>
            <button type="button" class="btn primary" @click="startSession" :disabled="sessionLoading || !sessionTariff">
              {{ sessionLoading ? 'Boshlanmoqda...' : 'Sessiyani boshlash' }}
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
import computersApi from '@/api/computers'
import bookingsApi from '@/api/bookings'
import sessionsApi from '@/api/sessions'
import tariffsApi from '@/api/tariffs'
import usersApi from '@/api/users'

// ==================== STATE ====================
const computers = ref([])
const selectedComputer = ref(null)
const lastResponse = ref(null)
const lastAction = ref('')
const loading = ref(false)

// Modal state
const showSessionModal = ref(false)
const selectedComputerForSession = ref(null)
const sessionDuration = ref(60)
const sessionTariff = ref(null)
const sessionUserId = ref(null)
const sessionLoading = ref(false)
const availableTariffs = ref([])

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

const moneyFormatter = new Intl.NumberFormat('uz-UZ')

const formatMoney = (value) => {
  if (!value && value !== 0) return '-'
  return `${moneyFormatter.format(Math.round(value))} so'm`
}

const pretty = (data) => {
  if (data === null || data === undefined) return 'Ma\'lumot yo\'q'
  try {
    return JSON.stringify(data, null, 2)
  } catch (error) {
    return String(data)
  }
}

const normalizeStatus = (value) => {
  if (!value) return 'unknown'
  const status = String(value).toString().trim().toLowerCase()
  if (status === 'available' || status === 'free' || status === 'bo\'sh') return 'available'
  if (status === 'busy' || status === 'occupied' || status === 'band') return 'busy'
  if (status === 'maintenance' || status === 'repair' || status === 'texnik') return 'maintenance'
  if (status === 'offline' || status === 'off' || status === 'o\'chiq') return 'offline'
  return 'unknown'
}

const statusText = (status) => {
  const map = {
    available: 'Bo\'sh',
    busy: 'Band',
    maintenance: 'Texnik xizmat',
    offline: 'Offline',
    unknown: 'Noma\'lum'
  }
  return map[normalizeStatus(status)] || status || 'Noma\'lum'
}

const toNumber = (value, fallback = null) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

const extractBody = (payload) => payload?.data ?? payload ?? null

const normalizeComputer = (raw = {}, zoneFallback = null) => {
  const computer = raw?.data ?? raw ?? {}
  const zoneSource = computer.zone ?? zoneFallback ?? {}
  const specs = computer.specs ?? {}

  const id = computer.id ?? computer.computerId ?? computer.computer_id ?? null
  const number = toNumber(computer.number ?? computer.pcNumber ?? computer.pc_number, null)
  const zoneId = computer.zoneId ?? computer.zone_id ?? zoneSource.id ?? zoneSource.zoneId ?? null
  const zoneName = computer.zoneName ?? computer.zone_name ?? zoneSource.name ?? zoneSource.zoneName ?? (zoneId !== null ? `Zone ${zoneId}` : '')
  
  let status = 'unknown'
  if (computer.status !== undefined && computer.status !== null) {
    status = computer.status
  } else if (computer.computerStatus !== undefined && computer.computerStatus !== null) {
    status = computer.computerStatus
  }
  
  const normalizedStatus = normalizeStatus(status)

  return {
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
    activeSession: computer.activeSession ?? computer.currentSession ?? computer.session ?? null
  }
}

const extractComputers = (payload) => {
  const body = extractBody(payload)
  if (Array.isArray(body)) return body.map((item) => normalizeComputer(item))
  if (!body || typeof body !== 'object') return []

  const candidates = [body.items, body.results, body.list, body.rows, body.computers, body.data, body.map]
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate.map((item) => normalizeComputer(item))
  }

  if (Array.isArray(body.zones)) {
    return body.zones.flatMap((zone) => {
      const list = zone?.computers
      if (!Array.isArray(list)) return []
      return list.map((computer) => normalizeComputer(computer, zone))
    })
  }

  const one = normalizeComputer(body)
  return one.id !== null || one.number !== null ? [one] : []
}

const dedupeComputers = (list) => {
  const map = new Map()
  list.forEach((computer) => {
    const key = computer.id !== null ? `id-${computer.id}` : `num-${computer.number}`
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
  return { total, available, busy, maintenance, offline, zones }
})

// ==================== MODAL FUNKSIYALAR ====================
const loadTariffs = async () => {
  try {
    const response = await tariffsApi.getActiveTariffs()
    availableTariffs.value = response?.data || response || []
  } catch (error) {
    console.error('Tariflar yuklanmadi:', error)
    availableTariffs.value = []
  }
}

const getTariffForZone = (computer) => {
  if (!availableTariffs.value.length) return null
  const zoneTariff = availableTariffs.value.find(t => t.zoneId === computer.zoneId)
  return zoneTariff || availableTariffs.value[0]
}

const calculatePrice = () => {
  if (!sessionTariff.value) return 0
  const pricePerHour = sessionTariff.value.pricePerHour || (sessionTariff.value.pricePerMinute || 100) * 60
  const pricePerMinute = pricePerHour / 60
  return Math.round(sessionDuration.value * pricePerMinute)
}

const openSessionModal = async (computer) => {
  selectedComputerForSession.value = computer
  await loadTariffs()
  sessionTariff.value = getTariffForZone(computer)
  sessionDuration.value = 60
  sessionUserId.value = null
  showSessionModal.value = true
}

const closeSessionModal = () => {
  showSessionModal.value = false
  selectedComputerForSession.value = null
  sessionDuration.value = 60
  sessionTariff.value = null
  sessionUserId.value = null
}

const startSession = async () => {
  if (!sessionTariff.value) {
    ElMessage.warning('Tarif mavjud emas')
    return
  }
  if (!selectedComputerForSession.value) {
    ElMessage.warning('Kompyuter tanlanmagan')
    return
  }

  sessionLoading.value = true
  try {
    let userId = sessionUserId.value
    
    // Agar user ID kiritilmagan bo'lsa, avtomatik foydalanuvchi yaratish
    if (!userId) {
      const guestUser = {
        username: `guest_${Date.now()}`,
        fullName: 'Mehmon foydalanuvchi',
        phone: '+998901234567',
        password: 'guest123'
      }
      
      try {
        const newUser = await usersApi.createUser(guestUser)
        userId = newUser.id || newUser.userId
        ElMessage.info(`Yangi foydalanuvchi yaratildi (ID: ${userId})`)
      } catch (error) {
        // Agar user yaratishda xatolik bo'lsa, default user ID ishlatamiz
        userId = 1
        ElMessage.warning('Avtomatik foydalanuvchi yaratilmadi, default user ishlatiladi')
      }
    } else {
      // Kiritilgan ID bo'yicha user mavjudligini tekshirish
      try {
        await usersApi.getUserById(userId)
      } catch (error) {
        ElMessage.error(`User ID ${userId} topilmadi!`)
        sessionLoading.value = false
        return
      }
    }

    const payload = {
      userId: userId,
      computerId: selectedComputerForSession.value.id,
      tariffId: sessionTariff.value.id,
      notes: `${sessionDuration.value} daqiqa uchun sessiya (User ID: ${userId})`
    }

    await sessionsApi.startSession(payload)
    ElMessage.success(`Sessiya boshlandi! (${sessionDuration.value} daqiqa, ${formatMoney(calculatePrice())})`)
    closeSessionModal()
    await runGetAll()
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || error?.message || 'Sessiya boshlanmadi')
  } finally {
    sessionLoading.value = false
  }
}

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

  if (computer.status !== 'available') {
    if (computer.status === 'busy') ElMessage.info('Bu kompyuter hozirda band')
    else if (computer.status === 'maintenance') ElMessage.warning('Bu kompyuter texnik xizmatda')
    else if (computer.status === 'offline') ElMessage.error('Bu kompyuter offline holatda')
    return
  }

  try {
    await ElMessageBox.confirm(
      `Kompyuter: ${computer.name || `PC-${computer.number}`}\n\nQanday amal bajarmoqchisiz?`,
      'Amalni tanlang',
      {
        confirmButtonText: '📅 Bron qilish',
        cancelButtonText: '▶️ Sessiya yoqish',
        type: 'info',
        distinguishCancelAndClose: true
      }
    )
    // Bron qilish
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
    if (err === 'cancel') {
      // Sessiya yoqish
      openSessionModal(computer)
    }
  }
}

const clearSelection = () => {
  selectedComputer.value = null
}

const applyList = (list) => {
  computers.value = dedupeComputers(list)
  if (!computers.value.length) {
    clearSelection()
    return
  }
  const current = selectedComputer.value
  const next = computers.value.find((item) => item.id !== null && item.id === current?.id) || computers.value[0]
  syncFormsByComputer(next)
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

const runGetAll = async (showToast = true) => {
  loading.value = true
  const response = await runWithToast(
    () => computersApi.getAllComputers(),
    showToast ? 'Kompyuterlar yuklandi' : '',
    'Barcha kompyuterlar'
  )
  if (response) applyList(extractComputers(response))
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
  const list = [...computers.value]
  const index = list.findIndex((item) => item.id === found.id)
  if (index >= 0) list[index] = found
  else list.unshift(found)
  applyList(list)
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
onMounted(() => runGetAll(false))
</script>

<style scoped>
.input-xarakteristik {
  width: 100px;
}
.computers-page {
  display: grid;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(135deg, #0a0f1a 0%, #0c1220 100%);
  min-height: 100vh;
}

.hero-panel,
.data-panel {
  border-radius: 20px;
  border: 1px solid rgba(125, 190, 255, 0.3);
  background: linear-gradient(145deg, rgba(8, 20, 44, 0.92), rgba(10, 27, 59, 0.75));
  padding: 20px;
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
  transition: all 0.2s ease;
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
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(125, 190, 255, 0.2);
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
  transition: transform 0.2s ease, border-color 0.2s ease;
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
  grid-template-columns: repeat(2, 1fr);
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
  grid-template-columns: repeat(3, 1fr);
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

.json-box {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  padding: 12px;
  overflow-x: auto;
  font-size: 12px;
  color: #b8d0f0;
  margin-top: 12px;
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
  max-width: 450px;
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
  gap: 16px;
}

.computer-info {
  background: rgba(74, 144, 226, 0.1);
  padding: 12px;
  border-radius: 12px;
  text-align: center;
}

.computer-info strong {
  display: block;
  color: #fff;
  font-size: 16px;
  margin-bottom: 4px;
}

.computer-info span {
  color: #7db9ff;
  font-size: 12px;
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

.input-hint {
  color: #ffb86c;
  font-size: 11px;
  margin-top: 4px;
}

.modal-input, .modal-select {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(74, 144, 226, 0.3);
  background: rgba(11, 33, 69, 0.6);
  color: #fff;
  font-size: 14px;
}

.modal-input:focus, .modal-select:focus {
  outline: none;
  border-color: rgba(74, 144, 226, 0.8);
}

.duration-control {
  display: flex;
  align-items: center;
  gap: 10px;
}

.duration-btn {
  padding: 8px 12px;
  background: rgba(74, 144, 226, 0.2);
  border: 1px solid rgba(74, 144, 226, 0.4);
  border-radius: 8px;
  color: #7db9ff;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.duration-btn:hover {
  background: rgba(74, 144, 226, 0.3);
}

.duration-input {
  flex: 1;
  text-align: center;
  padding: 8px;
  border-radius: 8px;
  border: 1px solid rgba(74, 144, 226, 0.3);
  background: rgba(11, 33, 69, 0.6);
  color: #fff;
  font-size: 16px;
}

.duration-presets {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.preset {
  padding: 4px 10px;
  background: rgba(74, 144, 226, 0.1);
  border-radius: 16px;
  font-size: 11px;
  color: #9ec0e4;
  cursor: pointer;
  transition: all 0.2s;
}

.preset:hover {
  background: rgba(74, 144, 226, 0.3);
  color: #fff;
}

.price-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: rgba(74, 144, 226, 0.1);
  border-radius: 12px;
  margin-top: 8px;
}

.price-info span {
  color: #9ec0e4;
  font-size: 14px;
}

.price-info strong {
  color: #6bc46b;
  font-size: 20px;
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

@media (max-width: 920px) {
  .triple-grid,
  .meta-grid {
    grid-template-columns: 1fr;
  }
  
  .modal-container {
    width: 95%;
    margin: 10px;
  }
}
</style>
