<template>
  <section class="page-wrap">
    <article class="panel">
      <div class="title-row">
        <div>
          <h2>Foydalanuvchilar</h2>
          <p>Users + Balance endpointlari to'liq admin boshqaruvi.</p>
        </div>

        <button type="button" class="btn-primary" @click="openCreateModal">
          + Yangi foydalanuvchi
        </button>
      </div>

      <div class="toolbar">
        <input
          v-model.trim="search"
          type="text"
          placeholder="Username yoki ism bo`yicha qidiruv"
          @keyup.enter="applySearch"
        />
        <button type="button" class="btn-secondary" :disabled="userStore.loading" @click="applySearch">
          Qidirish
        </button>
        <button type="button" class="btn-secondary" :disabled="userStore.loading" @click="resetSearch">
          Tozalash
        </button>
      </div>

      <div v-if="userStore.loading" class="loading-box">Yuklanmoqda...</div>

      <template v-else>
        <div v-if="!users.length" class="empty-box">Foydalanuvchilar topilmadi.</div>

        <table v-else>
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>To'liq ism</th>
              <th>Telefon</th>
              <th>Balans</th>
              <th>Status</th>
              <th>Amallar</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>{{ user.id }}</td>
              <td>{{ user.username || '-' }}</td>
              <td>{{ user.fullName || '-' }}</td>
              <td>{{ user.phone || '-' }}</td>
              <td>{{ formatMoney(user.balance) }}</td>
              <td>
                <span class="status" :class="statusClass(user)">
                  {{ statusText(user) }}
                </span>
              </td>
              <td>
                <div class="action-row">
                  <button type="button" class="action-btn" @click="openEditModal(user)">Edit</button>
                  <button type="button" class="action-btn" @click="openBalanceModal(user, 'deposit')">Deposit</button>
                  <button type="button" class="action-btn" @click="openBalanceModal(user, 'adjust')">Adjust</button>
                  <button type="button" class="action-btn" @click="showUserInfo(user)">Info</button>
                  <button type="button" class="action-btn" @click="showUserSessions(user)">Sessions</button>
                  <button type="button" class="action-btn" @click="showUserTransactions(user)">Tx</button>
                  <button type="button" class="action-btn" @click="showUserBalance(user)">Balance</button>
                  <button
                    type="button"
                    class="action-btn"
                    :disabled="userStore.submitting"
                    @click="toggleBlock(user)"
                  >
                    {{ user.isBlocked ? 'Unblock' : 'Block' }}
                  </button>
                  <button
                    type="button"
                    class="action-btn danger"
                    :disabled="userStore.submitting"
                    @click="removeUser(user)"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="pagination-row">
          <p>
            Jami: {{ userStore.pagination.total }} | Sahifa: {{ userStore.pagination.page }}/{{
              userStore.pagination.totalPages
            }}
          </p>

          <div class="pagination-actions">
            <button
              type="button"
              class="btn-secondary"
              :disabled="userStore.loading || userStore.pagination.page <= 1"
              @click="goToPage(userStore.pagination.page - 1)"
            >
              Oldingi
            </button>
            <button
              type="button"
              class="btn-secondary"
              :disabled="userStore.loading || userStore.pagination.page >= userStore.pagination.totalPages"
              @click="goToPage(userStore.pagination.page + 1)"
            >
              Keyingi
            </button>
          </div>
        </div>
      </template>
    </article>

    <article class="panel" v-if="inspectorTitle">
      <div class="title-row">
        <h3>{{ inspectorTitle }}</h3>
        <button type="button" class="btn-secondary" @click="clearInspector">Yopish</button>
      </div>

      <div v-if="inspectorLoading" class="loading-box">Yuklanmoqda...</div>
      <pre v-else class="json-box">{{ pretty(inspectorData) }}</pre>
    </article>

    <UserFormModal
      v-model="isUserModalOpen"
      :mode="userModalMode"
      :user="selectedUser"
      :loading="userStore.submitting"
      @submit="submitUserForm"
    />

    <BalanceDepositModal
      v-model="isBalanceModalOpen"
      :mode="balanceModalMode"
      :user="selectedUser"
      :loading="balanceStore.loading"
      @submit="submitBalanceOperation"
    />
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import usersApi from '@/api/users'
import { useUserStore } from '@/stores/user'
import { useBalanceStore } from '@/stores/balance'
import UserFormModal from './UserFormModal.vue'
import BalanceDepositModal from './BalanceDepositModal.vue'

const userStore = useUserStore()
const balanceStore = useBalanceStore()

const search = ref('')
const isUserModalOpen = ref(false)
const isBalanceModalOpen = ref(false)
const userModalMode = ref('create')
const balanceModalMode = ref('deposit')
const selectedUser = ref(null)

const inspectorTitle = ref('')
const inspectorData = ref(null)
const inspectorLoading = ref(false)

const users = computed(() => userStore.users.filter((user) => user.isActive))

const formatMoney = (value) => {
  const amount = Number(value)
  const numeric = Number.isFinite(amount) ? amount : 0

  return `${new Intl.NumberFormat('ru-RU').format(numeric)} so'm`
}

const statusText = (user) => {
  if (user.isBlocked) {
    return 'Blocked'
  }

  if (user.isOnline || user.hasLoginHistory) {
    return 'Active'
  }

  if (!user.hasLoginSignal) {
    return user.isActive ? 'Active' : 'Inactive'
  }

  return 'Inactive'
}

const statusClass = (user) => {
  if (user.isBlocked) {
    return 'blocked'
  }

  return statusText(user) === 'Active' ? 'ok' : 'inactive'
}

const pretty = (value) => {
  if (value === null || value === undefined) {
    return 'No data'
  }

  return JSON.stringify(value, null, 2)
}

const setInspector = async (title, request) => {
  inspectorTitle.value = title
  inspectorLoading.value = true

  try {
    inspectorData.value = await request()
  } catch (error) {
    inspectorData.value = {
      message: error.message || 'Xatolik yuz berdi'
    }
    ElMessage.error(error.message || 'So`rov bajarilmadi')
  } finally {
    inspectorLoading.value = false
  }
}

const clearInspector = () => {
  inspectorTitle.value = ''
  inspectorData.value = null
  inspectorLoading.value = false
}

const loadUsers = async (options = {}) => {
  try {
    await userStore.fetchUsers(options)
  } catch (error) {
    ElMessage.error(error.message || 'Foydalanuvchilarni yuklab bo`lmadi')
  }
}

const applySearch = async () => {
  await loadUsers({
    page: 1,
    search: search.value
  })
}

const resetSearch = async () => {
  search.value = ''
  await loadUsers({
    page: 1,
    search: ''
  })
}

const goToPage = async (page) => {
  await loadUsers({ page })
}

const openCreateModal = () => {
  userModalMode.value = 'create'
  selectedUser.value = null
  isUserModalOpen.value = true
}

const openEditModal = (user) => {
  userModalMode.value = 'edit'
  selectedUser.value = user
  isUserModalOpen.value = true
}

const openBalanceModal = (user, mode = 'deposit') => {
  selectedUser.value = user
  balanceModalMode.value = mode
  isBalanceModalOpen.value = true
}

const submitUserForm = async (payload) => {
  try {
    if (userModalMode.value === 'create') {
      await userStore.createUser(payload)
      ElMessage.success('Foydalanuvchi yaratildi')
    } else {
      await userStore.updateUser(selectedUser.value.id, payload)
      ElMessage.success('Foydalanuvchi yangilandi')
    }

    isUserModalOpen.value = false
  } catch (error) {
    ElMessage.error(error.message || 'Amalni bajarib bo`lmadi')
  }
}

const submitBalanceOperation = async (payload) => {
  try {
    if (balanceModalMode.value === 'adjust') {
      await balanceStore.adjustUserBalance(payload)
      ElMessage.success('Balans qo`lda sozlandi')
    } else {
      await balanceStore.depositToUser(payload)
      ElMessage.success('Balans muvaffaqiyatli to`ldirildi')
    }

    await loadUsers({ page: userStore.pagination.page })
    isBalanceModalOpen.value = false
  } catch (error) {
    ElMessage.error(error.message || 'Balans amali bajarilmadi')
  }
}

const showUserInfo = async (user) => {
  await setInspector(`User #${user.id} ma'lumoti`, () => usersApi.getUserById(user.id))
}

const showUserSessions = async (user) => {
  await setInspector(`User #${user.id} sessiyalari`, () => usersApi.getUserSessions(user.id))
}

const showUserTransactions = async (user) => {
  await setInspector(`User #${user.id} tranzaksiyalari`, () => usersApi.getUserTransactions(user.id))
}

const showUserBalance = async (user) => {
  await setInspector(`User #${user.id} balansi`, () => balanceStore.getUserBalance(user.id))
}

const toggleBlock = async (user) => {
  const targetAction = user.isBlocked ? 'blokdan chiqarish' : 'bloklash'

  try {
    await ElMessageBox.confirm(`Userni ${targetAction}ni tasdiqlaysizmi?`, 'Tasdiqlash', {
      confirmButtonText: 'Ha',
      cancelButtonText: 'Yo`q',
      type: 'warning'
    })
  } catch {
    return
  }

  try {
    await userStore.toggleBlockUser(user.id)
    ElMessage.success(`Foydalanuvchi ${targetAction} qilindi`)
  } catch (error) {
    ElMessage.error(error.message || 'User holatini o`zgartirib bo`lmadi')
  }
}

const removeUser = async (user) => {
  const label = user.username || 'Foydalanuvchi'

  try {
    await ElMessageBox.confirm(`${label} ni o'chirishni tasdiqlaysizmi?`, 'Diqqat', {
      confirmButtonText: 'Delete',
      cancelButtonText: 'Bekor qilish',
      type: 'warning'
    })
  } catch {
    return
  }

  try {
    await userStore.deleteUser(user.id)
    ElMessage.success('Foydalanuvchi o`chirildi')
  } catch (error) {
    ElMessage.error(error.message || 'Foydalanuvchini o`chirib bo`lmadi')
  }
}

onMounted(async () => {
  search.value = userStore.filters.search
  await loadUsers({
    page: 1,
    search: search.value
  })
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
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
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

.toolbar {
  margin-top: 14px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

input {
  flex: 1;
  min-width: 220px;
  border-radius: 12px;
  border: 1px solid rgba(128, 188, 255, 0.32);
  background: rgba(11, 33, 69, 0.58);
  color: #eaf4ff;
  padding: 10px 12px;
  outline: none;
}

input::placeholder {
  color: #7e9ec4;
}

.btn-primary,
.btn-secondary,
.action-btn {
  border-radius: 12px;
  padding: 10px 14px;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary {
  border: 1px solid rgba(130, 191, 255, 0.48);
  color: #edf6ff;
  background: linear-gradient(180deg, rgba(33, 115, 230, 0.66), rgba(24, 72, 151, 0.72));
}

.btn-secondary,
.action-btn {
  border: 1px solid rgba(131, 191, 255, 0.45);
  background: rgba(20, 50, 99, 0.54);
  color: #e4f1ff;
}

.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.action-btn {
  padding: 6px 10px;
  border-radius: 10px;
  font-size: 12px;
}

.action-btn.danger {
  border-color: rgba(255, 131, 131, 0.45);
  color: #ffd5d5;
  background: rgba(124, 38, 38, 0.55);
}

.loading-box,
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
  margin-top: 14px;
  border-collapse: collapse;
}

th,
td {
  text-align: left;
  padding: 10px 8px;
  border-bottom: 1px solid rgba(136, 195, 255, 0.14);
  color: #bdd1e9;
  font-size: 14px;
}

th {
  color: #95b3d6;
  font-size: 12px;
  letter-spacing: 0.7px;
  text-transform: uppercase;
}

.status {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
}

.status.ok {
  border: 1px solid rgba(130, 255, 180, 0.4);
  color: #b8ffd2;
  background: rgba(17, 114, 61, 0.36);
}

.status.blocked {
  border: 1px solid rgba(255, 179, 110, 0.45);
  color: #ffd9b0;
  background: rgba(118, 73, 12, 0.42);
}

.status.inactive {
  border: 1px solid rgba(255, 133, 133, 0.4);
  color: #ffc1c1;
  background: rgba(127, 34, 34, 0.34);
}

.pagination-row {
  margin-top: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.pagination-row p {
  margin: 0;
}

.pagination-actions {
  display: flex;
  gap: 10px;
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

.btn-primary:disabled,
.btn-secondary:disabled,
.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 980px) {
  table {
    display: block;
    overflow-x: auto;
  }
}
</style>
