<template>
  <section class="zones-page">
    <article class="hero-panel">
      <div class="hero-head">
        <div>
          <p class="kicker">Zone Control Center</p>
          <h2>Zonalar boshqaruvi</h2>
          <p class="subtitle">Zonalarni chiroyli ko`rinishda boshqarish: create, update, delete, by-id va live preview.</p>
        </div>

        <div class="hero-actions">
          <button type="button" class="btn primary" :disabled="loading" @click="runGetAll">
            {{ loading ? 'Yuklanmoqda...' : 'Zonalarni yangilash' }}
          </button>
          <button type="button" class="btn" @click="clearSelection">Tanlovni tozalash</button>
        </div>
      </div>

      <div class="stat-grid">
        <article class="stat-card">
          <span class="stat-label">Jami zonalar</span>
          <strong>{{ stats.totalZones }}</strong>
        </article>
        <article class="stat-card">
          <span class="stat-label">Jami kompyuter</span>
          <strong>{{ stats.totalComputers }}</strong>
        </article>
        <article class="stat-card">
          <span class="stat-label">Eng katta zona</span>
          <strong>{{ stats.largestZoneName }}</strong>
        </article>
        <article class="stat-card">
          <span class="stat-label">Ranglar soni</span>
          <strong>{{ stats.uniqueColors }}</strong>
        </article>
      </div>

      <div class="zone-chips" v-if="zones.length">
        <button
          v-for="zone in zones"
          :key="zone.id || zone.name"
          type="button"
          class="zone-chip"
          :class="{ active: selectedZone?.id === zone.id }"
          @click="selectZone(zone)"
        >
          <span class="dot" :style="{ backgroundColor: zone.color }"></span>
          <span>{{ zone.name || 'Nomsiz zona' }}</span>
          <small>{{ zone.computersCount }} PC</small>
        </button>
      </div>
    </article>

    <article class="data-panel">
      <div class="panel-head">
        <h3>Zonalar jadvali</h3>
      </div>

      <div class="table-wrap" v-if="zones.length">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Zona</th>
              <th>Rang</th>
              <th>Kompyuterlar</th>
              <th>Tavsif</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="zone in zones"
              :key="zone.id || zone.name"
              :class="{ selected: selectedZone?.id === zone.id }"
              @click="selectZone(zone)"
            >
              <td>{{ zone.id ?? '-' }}</td>
              <td>{{ zone.name ?? '-' }}</td>
              <td>
                <span class="color-cell">
                  <span class="dot" :style="{ backgroundColor: zone.color }"></span>
                  {{ zone.color }}
                </span>
              </td>
              <td>{{ zone.computersCount }}</td>
              <td>{{ zone.description || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="empty-box">Hali ma`lumot yuklanmagan.</div>
    </article>

    <div class="forms-grid">
      <article class="form-card">
        <h3>Create Zone</h3>
        <form class="form-grid" @submit.prevent="runCreate">
          <label>
            <span>Nomi</span>
            <input v-model.trim="createForm.name" type="text" placeholder="VIP Zone" />
          </label>

          <label>
            <span>Tavsif</span>
            <input
              v-model.trim="createForm.description"
              type="text"
              placeholder="Yuqori darajali kompyuterlar"
            />
          </label>

          <div class="color-row">
            <label>
              <span>HEX rang</span>
              <input v-model.trim="createForm.color" type="text" placeholder="#FFD700" />
            </label>
            <label>
              <span>Picker</span>
              <input type="color" :value="createColorPreview" @input="onCreateColorPick" />
            </label>
          </div>

          <div class="preview-box" :style="{ borderColor: createColorPreview }">
            <span class="dot" :style="{ backgroundColor: createColorPreview }"></span>
            <p>Preview: {{ createForm.name || 'Yangi zona' }}</p>
          </div>

          <button type="submit" class="btn primary">Zona yaratish</button>
        </form>
      </article>

      <article class="form-card">
        <h3>Update Zone</h3>
        <form class="form-grid" @submit.prevent="runUpdate">
          <label>
            <span>Zone ID</span>
            <input v-model.number="updateForm.zoneId" type="number" placeholder="Zone ID" />
          </label>

          <label>
            <span>Nomi</span>
            <input v-model.trim="updateForm.name" type="text" placeholder="VIP Zone" />
          </label>

          <label>
            <span>Tavsif</span>
            <input v-model.trim="updateForm.description" type="text" placeholder="Yangilangan tavsif" />
          </label>

          <div class="color-row">
            <label>
              <span>HEX rang</span>
              <input v-model.trim="updateForm.color" type="text" placeholder="#FF6B6B" />
            </label>
            <label>
              <span>Picker</span>
              <input type="color" :value="updateColorPreview" @input="onUpdateColorPick" />
            </label>
          </div>

          <div class="preview-box" :style="{ borderColor: updateColorPreview }">
            <span class="dot" :style="{ backgroundColor: updateColorPreview }"></span>
            <p>Preview: {{ updateForm.name || 'Tanlangan zona' }}</p>
          </div>

          <button type="submit" class="btn primary">Zona yangilash</button>
        </form>
      </article>

      <article class="form-card">
        <h3>Get Zone By ID</h3>
        <div class="inline-row">
          <input v-model.number="idForm.zoneId" type="number" placeholder="Zone ID" />
          <button type="button" class="btn" @click="runGetById">Olish</button>
        </div>

        <h3 class="sub-title">Delete Zone</h3>
        <div class="inline-row">
          <input v-model.number="deleteForm.zoneId" type="number" placeholder="Zone ID" />
          <button type="button" class="btn danger" @click="runDelete">Delete</button>
        </div>

        <div class="selected-zone" v-if="selectedZone">
          <p>Tanlangan zona</p>
          <strong>{{ selectedZone.name }} (ID: {{ selectedZone.id }})</strong>
          <span>{{ selectedZone.computersCount }} PC</span>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import zonesApi from '@/api/zones'

const zones = ref([])
const selectedZone = ref(null)
const lastResponse = ref(null)
const lastAction = ref('')
const loading = ref(false)

const idForm = reactive({ zoneId: 1 })
const deleteForm = reactive({ zoneId: 1 })
const createForm = reactive({
  name: 'VIP Zone',
  description: 'Yuqori darajali kompyuterlar',
  color: '#FFD700'
})
const updateForm = reactive({
  zoneId: 1,
  name: 'VIP Zone',
  description: 'Yangilangan zona',
  color: '#FF6B6B'
})

const extractBody = (payload) => payload?.data ?? payload ?? null
const extractArray = (payload) => {
  const body = extractBody(payload)

  if (Array.isArray(body)) return body
  if (Array.isArray(body?.items)) return body.items
  if (Array.isArray(body?.zones)) return body.zones

  return []
}

const normalizeColor = (value) => {
  const color = (value ?? '').toString().trim()
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color)) {
    return color
  }

  return '#2aa6ff'
}

const toLooseNumber = (value) => {
  if (value === null || value === undefined) {
    return null
  }

  const direct = Number(value)
  if (Number.isFinite(direct)) {
    return direct
  }

  if (typeof value === 'string') {
    const match = value.match(/-?\d+(\.\d+)?/)
    if (match) {
      const parsed = Number(match[0])
      if (Number.isFinite(parsed)) {
        return parsed
      }
    }
  }

  return null
}

const toNumber = (value, fallback = 0) => {
  const numeric = toLooseNumber(value)
  return numeric === null ? fallback : numeric
}

const getComputersCount = (zone = {}) => {
  const stats = zone.stats ?? zone.meta ?? {}
  const candidates = [
    zone.computersCount,
    zone.computers_count,
    zone.computerCount,
    zone.computer_count,
    zone.totalComputers,
    zone.total_computers,
    zone.pcCount,
    zone.pc_count,
    zone.totalPcs,
    zone.total_pcs,
    stats.computersCount,
    stats.computers_count,
    stats.computerCount,
    stats.computer_count,
    stats.totalComputers,
    stats.total_computers
  ]

  for (const value of candidates) {
    const parsed = toLooseNumber(value)
    if (parsed !== null) {
      return Math.max(0, Math.round(parsed))
    }
  }

  if (Array.isArray(zone.computers)) {
    return zone.computers.length
  }

  if (Array.isArray(zone.pcs)) {
    return zone.pcs.length
  }

  return 0
}

const normalizeZone = (raw = {}) => {
  const zone = raw?.data ?? raw ?? {}

  const computersCount = getComputersCount(zone)

  return {
    id: zone.id ?? zone.zoneId ?? zone.zone_id ?? null,
    name: zone.name ?? '',
    description: zone.description ?? '',
    color: normalizeColor(zone.color),
    computersCount,
    raw: zone
  }
}

const stats = computed(() => {
  const totalZones = zones.value.length
  const totalComputers = zones.value.reduce((sum, zone) => sum + toNumber(zone.computersCount, 0), 0)
  const largestZone = zones.value.reduce(
    (current, zone) => (zone.computersCount > current.computersCount ? zone : current),
    { name: '-', computersCount: -1 }
  )
  const uniqueColors = new Set(zones.value.map((zone) => zone.color)).size

  return {
    totalZones,
    totalComputers,
    largestZoneName: largestZone.name || '-',
    uniqueColors
  }
})

const createColorPreview = computed(() => normalizeColor(createForm.color))
const updateColorPreview = computed(() => normalizeColor(updateForm.color))
const selectedZoneComputers = computed(() => {
  const computers = selectedZone.value?.raw?.computers

  if (!Array.isArray(computers)) {
    return []
  }

  return computers
    .map((item) => item?.name ?? item?.computerName ?? item?.number ?? item?.id)
    .filter(Boolean)
})

const lastResult = computed(() => {
  const body = extractBody(lastResponse.value)

  if (body === null || body === undefined) {
    return null
  }

  const list = extractArray(lastResponse.value)
  if (list.length) {
    return {
      statusText: 'Muvaffaqiyatli',
      id: null,
      name: null,
      color: null,
      count: list.length,
      note: `${list.length} ta yozuv qaytdi.`
    }
  }

  if (typeof body !== 'object') {
    return {
      statusText: String(body),
      id: null,
      name: null,
      color: null,
      count: null,
      note: null
    }
  }

  const id = body.id ?? body.zoneId ?? body.zone_id ?? null
  const name = body.name ?? body.zoneName ?? body.zone_name ?? null
  const color = body.color ? normalizeColor(body.color) : null
  const count = getComputersCount(body)
  const note = body.description ?? body.message ?? null

  return {
    statusText: body.status ?? (body.message ? 'Muvaffaqiyatli' : 'Bajarildi'),
    id,
    name,
    color,
    count,
    note
  }
})

const onCreateColorPick = (event) => {
  createForm.color = event?.target?.value || createForm.color
}

const onUpdateColorPick = (event) => {
  updateForm.color = event?.target?.value || updateForm.color
}

const syncFormsByZone = (zone) => {
  if (!zone) return

  selectedZone.value = zone
  idForm.zoneId = zone.id || idForm.zoneId
  deleteForm.zoneId = zone.id || deleteForm.zoneId

  updateForm.zoneId = zone.id || updateForm.zoneId
  updateForm.name = zone.name || ''
  updateForm.description = zone.description || ''
  updateForm.color = zone.color || '#2aa6ff'
}

const selectZone = (zone) => {
  syncFormsByZone(zone)
}

const clearSelection = () => {
  selectedZone.value = null
}

const runWithToast = async (request, message, actionLabel = '') => {
  try {
    const response = await request()
    lastResponse.value = response
    lastAction.value = actionLabel || message || ''

    if (message) {
      ElMessage.success(message)
    }

    return response
  } catch (error) {
    ElMessage.error(error?.message || 'So`rov bajarilmadi')
    return null
  }
}

const runGetAll = async () => {
  loading.value = true
  const response = await runWithToast(() => zonesApi.getAllZones(), 'Zonalar yuklandi', 'Barcha zonalarni olish')

  if (response) {
    zones.value = extractArray(response).map(normalizeZone)

    if (zones.value.length) {
      const nextSelected =
        zones.value.find((zone) => zone.id === selectedZone.value?.id) || zones.value[0]
      syncFormsByZone(nextSelected)
    } else {
      clearSelection()
    }
  }

  loading.value = false
}

const runGetById = async () => {
  if (!idForm.zoneId) {
    ElMessage.warning('Zone ID kiriting')
    return
  }

  const response = await runWithToast(
    () => zonesApi.getZoneById(idForm.zoneId),
    'Zona topildi',
    `Zone by ID (${idForm.zoneId})`
  )
  if (!response) return

  const body = extractBody(response)
  const zoneCandidate = Array.isArray(body) ? body[0] : body

  if (!zoneCandidate) {
    ElMessage.warning('Zona topilmadi')
    return
  }

  const normalized = normalizeZone(zoneCandidate)
  syncFormsByZone(normalized)
}

const runCreate = async () => {
  const payload = {
    name: createForm.name,
    description: createForm.description,
    color: normalizeColor(createForm.color)
  }

  const response = await runWithToast(() => zonesApi.createZone(payload), 'Zona yaratildi', 'Zona yaratish')
  if (!response) return

  await runGetAll()
}

const runUpdate = async () => {
  if (!updateForm.zoneId) {
    ElMessage.warning('Zone ID kiriting')
    return
  }

  const payload = {
    name: updateForm.name,
    description: updateForm.description,
    color: normalizeColor(updateForm.color)
  }

  const response = await runWithToast(
    () => zonesApi.updateZone(updateForm.zoneId, payload),
    'Zona yangilandi',
    `Zona yangilash (${updateForm.zoneId})`
  )

  if (!response) return

  await runGetAll()
}

const runDelete = async () => {
  if (!deleteForm.zoneId) {
    ElMessage.warning('Zone ID kiriting')
    return
  }

  const response = await runWithToast(
    () => zonesApi.deleteZone(deleteForm.zoneId),
    'Zona o`chirildi',
    `Zona o'chirish (${deleteForm.zoneId})`
  )
  if (!response) return

  await runGetAll()
}

onMounted(async () => {
  await runGetAll()
})
</script>

<style scoped>
.zones-page {
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
.inline-row,
.color-row {
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

.zone-chips {
  margin-top: 14px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.zone-chip {
  border-radius: 999px;
  border: 1px solid rgba(133, 191, 255, 0.32);
  background: rgba(11, 33, 70, 0.6);
  color: #d7e9ff;
  padding: 8px 12px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.zone-chip.active {
  border-color: rgba(152, 213, 255, 0.75);
  box-shadow: 0 0 0 1px rgba(167, 225, 255, 0.18) inset;
}

.zone-chip small {
  color: #9fc2e6;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  border: 1px solid rgba(255, 255, 255, 0.35);
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

.color-cell {
  display: inline-flex;
  align-items: center;
  gap: 8px;
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

input[type='color'] {
  width: 100%;
  min-height: 40px;
  padding: 4px;
  cursor: pointer;
}

.preview-box {
  border-radius: 12px;
  border: 1px solid rgba(133, 191, 255, 0.34);
  background: rgba(11, 30, 60, 0.5);
  padding: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-box p {
  margin: 0;
  color: #c4daf3;
}

.sub-title {
  margin-top: 8px;
}

.selected-zone {
  margin-top: 8px;
  border-radius: 12px;
  border: 1px dashed rgba(138, 197, 255, 0.4);
  padding: 10px;
  background: rgba(10, 28, 57, 0.45);
  display: grid;
  gap: 4px;
}

.selected-zone p {
  margin: 0;
  color: #9fc2e6;
  font-size: 12px;
}

.selected-zone strong {
  color: #fff;
}

.selected-zone span {
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

.color-strong {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.detail-description {
  margin: 12px 0 0;
  color: #c0d6ee;
}

.computer-tags {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.computer-tag {
  border-radius: 999px;
  border: 1px solid rgba(133, 191, 255, 0.3);
  background: rgba(11, 33, 68, 0.55);
  padding: 6px 10px;
  color: #d8e8fb;
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

@media (max-width: 980px) {
  table {
    display: block;
    overflow-x: auto;
  }
}
</style>
