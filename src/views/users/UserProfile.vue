<template>
  <section class="profile-wrap">
    <article class="panel">
      <div class="title-row">
        <div>
          <h2>Mening profilim</h2>
          <p>User endpointlari: profile, balance, sessions, transactions, bookings.</p>
        </div>

        <div class="toolbar">
          <button type="button" class="btn" :disabled="loading" @click="loadAll">Yangilash</button>
          <button type="button" class="btn" :disabled="authStore.loading" @click="refreshToken">
            Refresh token
          </button>
        </div>
      </div>

      <form class="form-grid" @submit.prevent="saveProfile">
        <label>
          <span>Username</span>
          <input v-model="profile.username" type="text" disabled />
        </label>

        <label>
          <span>To'liq ism</span>
          <input v-model.trim="profile.fullName" type="text" placeholder="To'liq ism" :disabled="saving" />
        </label>

        <label>
          <span>Telefon</span>
          <input v-model.trim="profile.phone" type="text" placeholder="+998901234567" :disabled="saving" />
        </label>

        <div class="actions">
          <button type="submit" class="btn primary" :disabled="saving">
            {{ saving ? 'Saqlanmoqda...' : 'Profilni saqlash' }}
          </button>
        </div>
      </form>
    </article>

    <article class="panel">
      <h3>Mening balansim</h3>
      <p class="big-number">{{ formatMoney(myBalance) }}</p>
    </article>

    <article class="panel">
      <h3>Mening faol sessiyam</h3>
      <pre class="json-box">{{ pretty(myActiveSession) }}</pre>
    </article>

    <article class="panel">
      <h3>Mening sessiyalarim</h3>
      <pre class="json-box">{{ pretty(mySessions) }}</pre>
    </article>

    <article class="panel">
      <h3>Mening tranzaksiyalarim</h3>
      <pre class="json-box">{{ pretty(myTransactions) }}</pre>
    </article>

    <article class="panel">
      <h3>Mening bronlarim</h3>
      <pre class="json-box">{{ pretty(myBookings) }}</pre>
    </article>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import usersApi from '@/api/users'
import balanceApi from '@/api/balance'
import sessionsApi from '@/api/sessions'
import transactionsApi from '@/api/transactions'
import bookingsApi from '@/api/bookings'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const loading = ref(false)
const saving = ref(false)

const profile = reactive({
  id: null,
  username: '',
  fullName: '',
  phone: ''
})

const myBalance = ref(0)
const mySessions = ref([])
const myActiveSession = ref(null)
const myTransactions = ref([])
const myBookings = ref([])

const extractBody = (payload) => payload?.data ?? payload ?? null
const asArray = (payload) => {
  const body = extractBody(payload)

  if (Array.isArray(body)) return body
  if (Array.isArray(body?.items)) return body.items
  if (Array.isArray(body?.results)) return body.results
  if (Array.isArray(body?.sessions)) return body.sessions
  if (Array.isArray(body?.transactions)) return body.transactions
  if (Array.isArray(body?.bookings)) return body.bookings

  return []
}

const pretty = (value) => {
  if (value === null || value === undefined) {
    return 'No data'
  }

  return JSON.stringify(value, null, 2)
}

const formatMoney = (value) => {
  const amount = Number(value)
  const numeric = Number.isFinite(amount) ? amount : 0
  return `${new Intl.NumberFormat('ru-RU').format(numeric)} so'm`
}

const loadProfile = async () => {
  const data = extractBody(await usersApi.getMyProfile())

  profile.id = data?.id ?? null
  profile.username = data?.username ?? ''
  profile.fullName = data?.fullName ?? ''
  profile.phone = data?.phone ?? ''
}

const loadAll = async () => {
  loading.value = true

  try {
    const [profileRes, balanceRes, sessionsRes, activeRes, txRes, bookingRes] = await Promise.all([
      usersApi.getMyProfile(),
      balanceApi.getMyBalance(),
      sessionsApi.getMySessions(),
      sessionsApi.getMyActiveSession(),
      transactionsApi.getMyTransactions({ page: 1, limit: 20 }),
      bookingsApi.getMyBookings()
    ])

    const profileData = extractBody(profileRes)
    profile.id = profileData?.id ?? null
    profile.username = profileData?.username ?? ''
    profile.fullName = profileData?.fullName ?? ''
    profile.phone = profileData?.phone ?? ''

    const balanceData = extractBody(balanceRes)
    myBalance.value =
      Number(balanceData?.balance ?? balanceData?.amount ?? balanceData?.currentBalance ?? 0) || 0

    mySessions.value = asArray(sessionsRes)
    myActiveSession.value = extractBody(activeRes)
    myTransactions.value = asArray(txRes)
    myBookings.value = asArray(bookingRes)
  } catch (error) {
    ElMessage.error(error?.message || 'Ma`lumotlarni yuklab bo`lmadi')
  } finally {
    loading.value = false
  }
}

const saveProfile = async () => {
  saving.value = true

  try {
    await usersApi.updateMyProfile({
      fullName: profile.fullName,
      phone: profile.phone
    })

    await loadProfile()
    ElMessage.success('Profil yangilandi')
  } catch (error) {
    ElMessage.error(error?.message || 'Profilni saqlab bo`lmadi')
  } finally {
    saving.value = false
  }
}

const refreshToken = async () => {
  try {
    await authStore.refreshAccessToken()
    await authStore.getMeSafe()
    ElMessage.success('Access token yangilandi')
  } catch (error) {
    ElMessage.error(error?.message || 'Token yangilanmadi')
  }
}

onMounted(async () => {
  await loadAll()
})
</script>

<style scoped>
.profile-wrap {
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

.big-number {
  font-size: 28px;
  color: #fff;
  margin-top: 10px;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.form-grid {
  margin-top: 14px;
  display: grid;
  gap: 10px;
}

label {
  display: grid;
  gap: 6px;
}

label span {
  color: #a9c2e2;
  font-size: 13px;
}

input {
  border-radius: 12px;
  border: 1px solid rgba(128, 188, 255, 0.34);
  background: rgba(11, 33, 69, 0.58);
  color: #eaf4ff;
  padding: 10px 12px;
  outline: none;
}

.actions {
  display: flex;
  justify-content: flex-end;
}

.btn {
  border-radius: 10px;
  padding: 10px 14px;
  border: 1px solid rgba(131, 191, 255, 0.45);
  background: rgba(20, 50, 99, 0.54);
  color: #e4f1ff;
  font-weight: 600;
  cursor: pointer;
}

.btn.primary {
  background: linear-gradient(180deg, rgba(33, 115, 230, 0.66), rgba(24, 72, 151, 0.72));
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
  max-height: 300px;
  overflow: auto;
}

@media (max-width: 640px) {
  .panel {
    padding: 14px;
  }

  .title-row {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar,
  .actions {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar .btn,
  .actions .btn {
    width: 100%;
  }

  .big-number {
    font-size: 22px;
  }
}
</style>
