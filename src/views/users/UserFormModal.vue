<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-root" @click.self="close">
      <div class="modal-card">
        <div class="modal-header">
          <h3>{{ isEditMode ? 'Foydalanuvchini tahrirlash' : 'Yangi foydalanuvchi' }}</h3>
          <button type="button" class="icon-btn" @click="close">✕</button>
        </div>

        <div v-if="isEditMode" class="search-section">
          <div class="search-wrapper">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Username bo'yicha qidirish..."
              class="search-input"
              @input="handleSearch"
              :disabled="loading"
            />
            <button 
              type="button" 
              class="search-btn" 
              @click="handleSearch"
              :disabled="loading"
            >
              🔍
            </button>
          </div>
          <div v-if="searchResults.length > 0 && searchQuery" class="search-results">
            <div
              v-for="user in searchResults"
              :key="user.id"
              class="search-result-item"
              @click="selectUser(user)"
            >
              <div class="result-info">
                <strong>{{ user.username }}</strong>
                <span>{{ user.fullName || 'Ism kiritilmagan' }}</span>
              </div>
              <span class="result-badge">ID: {{ user.id }}</span>
            </div>
          </div>
          <div v-else-if="searchQuery && !searchLoading && searchQuery.length > 2" class="no-results">
            Hech qanday foydalanuvchi topilmadi
          </div>
        </div>

        <form class="form-grid" @submit.prevent="handleSubmit">
          <label>
            <span>Username</span>
            <input
              v-model.trim="form.username"
              type="text"
              placeholder="username"
              :disabled="loading"
              :readonly="isEditMode && selectedUserFromSearch"
            />
          </label>

          <label>
            <span>To'liq ism</span>
            <input
              v-model.trim="form.fullName"
              type="text"
              placeholder="Ali Valiyev"
              :disabled="loading"
            />
          </label>

          <label>
            <span>Telefon</span>
            <input
              v-model.trim="form.phone"
              type="text"
              placeholder="+998901234567"
              :disabled="loading"
            />
          </label>

          <label>
            <span>{{ isEditMode ? 'Yangi parol (ixtiyoriy)' : 'Parol' }}</span>
            <input
              v-model="form.password"
              type="password"
              placeholder="******"
              :disabled="loading"
            />
          </label>

          <p v-if="error" class="error-text">{{ error }}</p>

          <div class="actions">
            <button type="button" class="ghost-btn" :disabled="loading" @click="close">
              Bekor qilish
            </button>
            <button type="submit" class="primary-btn" :disabled="loading">
              {{ loading ? 'Saqlanmoqda...' : isEditMode ? 'Saqlash' : 'Yaratish' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import usersApi from '@/api/users'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  mode: {
    type: String,
    default: 'create'
  },
  user: {
    type: Object,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'submit'])

const form = reactive({
  username: '',
  fullName: '',
  phone: '',
  password: ''
})

const searchQuery = ref('')
const searchResults = ref([])
const searchLoading = ref(false)
const selectedUserFromSearch = ref(null)

const error = computed(() => {
  if (!props.modelValue) {
    return ''
  }

  if (!form.username) {
    return 'Username majburiy'
  }

  if (!isEditMode.value && !form.password) {
    return 'Parol majburiy'
  }

  return ''
})

const isEditMode = computed(() => props.mode === 'edit')

const resetForm = () => {
  form.username = props.user?.username ?? ''
  form.fullName = props.user?.fullName ?? ''
  form.phone = props.user?.phone ?? ''
  form.password = ''
  searchQuery.value = ''
  searchResults.value = []
  selectedUserFromSearch.value = null
}

// Username bo'yicha qidirish
const handleSearch = async () => {
  const query = searchQuery.value.trim()
  
  if (!query || query.length < 2) {
    searchResults.value = []
    return
  }

  searchLoading.value = true
  try {
    const response = await usersApi.searchUsers(query)
    searchResults.value = response?.data || response || []
  } catch (error) {
    console.error('Qidiruv xatosi:', error)
    ElMessage.error('Foydalanuvchi qidirishda xatolik')
    searchResults.value = []
  } finally {
    searchLoading.value = false
  }
}

// Qidiruvdan foydalanuvchini tanlash
const selectUser = (user) => {
  form.username = user.username
  form.fullName = user.fullName || ''
  form.phone = user.phone || ''
  selectedUserFromSearch.value = user
  searchQuery.value = ''
  searchResults.value = []
  ElMessage.success(`${user.username} foydalanuvchisi tanlandi`)
}

// Debounce qidiruv uchun
let searchTimeout
const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    handleSearch()
  }, 500)
}

watch(searchQuery, (newVal) => {
  if (newVal && newVal.length >= 2) {
    debouncedSearch()
  } else {
    searchResults.value = []
  }
})

watch(
  () => [props.modelValue, props.mode, props.user],
  () => {
    if (props.modelValue) {
      resetForm()
    }
  },
  { immediate: true, deep: true }
)

const close = () => {
  emit('update:modelValue', false)
  resetForm()
}

const handleSubmit = () => {
  if (error.value) {
    return
  }

  const payload = {
    username: form.username,
    fullName: form.fullName,
    phone: form.phone
  }

  if (form.password) {
    payload.password = form.password
  }

  emit('submit', payload)
}
</script>

<style scoped>
.modal-root {
  position: fixed;
  inset: 0;
  z-index: 40;
  background: rgba(3, 8, 20, 0.85);
  display: grid;
  place-items: center;
  padding: 18px;
  backdrop-filter: blur(4px);
}

.modal-card {
  width: min(550px, 100%);
  max-height: 90vh;
  overflow-y: auto;
  border-radius: 20px;
  border: 1px solid rgba(125, 190, 255, 0.4);
  background: linear-gradient(145deg, rgba(8, 20, 44, 0.98), rgba(10, 27, 59, 0.9));
  box-shadow: 0 24px 50px rgba(2, 10, 24, 0.6);
  padding: 20px;
}

.modal-card::-webkit-scrollbar {
  width: 6px;
}

.modal-card::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.modal-card::-webkit-scrollbar-thumb {
  background: rgba(74, 144, 226, 0.5);
  border-radius: 3px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(125, 190, 255, 0.2);
}

h3 {
  margin: 0;
  color: #f4f9ff;
  font-size: 20px;
}

.icon-btn {
  border: 1px solid rgba(129, 189, 255, 0.45);
  background: rgba(14, 39, 80, 0.6);
  color: #dceeff;
  border-radius: 10px;
  width: 34px;
  height: 34px;
  cursor: pointer;
  font-size: 18px;
  transition: all 0.2s ease;
}

.icon-btn:hover {
  background: rgba(14, 39, 80, 0.9);
  transform: scale(1.05);
}

/* Search Section */
.search-section {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(125, 190, 255, 0.2);
}

.search-wrapper {
  display: flex;
  gap: 8px;
  align-items: center;
}

.search-input {
  flex: 1;
  border-radius: 12px;
  border: 1px solid rgba(128, 188, 255, 0.4);
  background: rgba(11, 33, 69, 0.7);
  color: #eaf4ff;
  padding: 10px 12px;
  outline: none;
  font-size: 14px;
  transition: all 0.2s ease;
}

.search-input:focus {
  border-color: rgba(74, 144, 226, 0.8);
  box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
}

.search-input::placeholder {
  color: #7e9ec4;
}

.search-btn {
  border-radius: 10px;
  padding: 10px 14px;
  border: 1px solid rgba(131, 191, 255, 0.45);
  background: rgba(20, 50, 99, 0.7);
  color: #e4f1ff;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 16px;
}

.search-btn:hover:not(:disabled) {
  background: rgba(33, 83, 153, 0.8);
  transform: translateY(-1px);
}

.search-results {
  margin-top: 12px;
  max-height: 200px;
  overflow-y: auto;
  border-radius: 12px;
  background: rgba(10, 28, 57, 0.6);
  border: 1px solid rgba(128, 188, 255, 0.3);
}

.search-result-item {
  padding: 10px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid rgba(128, 188, 255, 0.2);
}

.search-result-item:last-child {
  border-bottom: none;
}

.search-result-item:hover {
  background: rgba(74, 144, 226, 0.2);
  transform: translateX(4px);
}

.result-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.result-info strong {
  color: #fff;
  font-size: 14px;
}

.result-info span {
  color: #9fc2e6;
  font-size: 12px;
}

.result-badge {
  background: rgba(74, 144, 226, 0.3);
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 11px;
  color: #7db9ff;
  font-family: monospace;
}

.no-results {
  margin-top: 12px;
  padding: 12px;
  text-align: center;
  color: #9fc2e6;
  background: rgba(10, 28, 57, 0.4);
  border-radius: 10px;
  font-size: 13px;
}

/* Form */
.form-grid {
  display: grid;
  gap: 12px;
}

label {
  display: grid;
  gap: 6px;
}

label span {
  color: #a9c2e2;
  font-size: 13px;
  font-weight: 500;
}

input {
  border-radius: 12px;
  border: 1px solid rgba(128, 188, 255, 0.34);
  background: rgba(11, 33, 69, 0.58);
  color: #eaf4ff;
  padding: 10px 12px;
  outline: none;
  font-size: 14px;
  transition: all 0.2s ease;
}

input:focus {
  border-color: rgba(74, 144, 226, 0.7);
  background: rgba(11, 33, 69, 0.8);
}

input:read-only {
  opacity: 0.7;
  cursor: default;
}

input::placeholder {
  color: #7e9ec4;
}

.error-text {
  margin: 0;
  color: #ff9f9f;
  font-size: 13px;
  padding: 8px;
  background: rgba(255, 100, 100, 0.1);
  border-radius: 8px;
  text-align: center;
}

.actions {
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.ghost-btn,
.primary-btn {
  border-radius: 10px;
  padding: 10px 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
}

.ghost-btn {
  border: 1px solid rgba(131, 191, 255, 0.45);
  background: rgba(20, 50, 99, 0.54);
  color: #e4f1ff;
}

.ghost-btn:hover:not(:disabled) {
  background: rgba(33, 83, 153, 0.7);
  transform: translateY(-1px);
}

.primary-btn {
  border: 1px solid rgba(131, 191, 255, 0.55);
  color: #f4f8ff;
  background: linear-gradient(180deg, rgba(32, 110, 223, 0.82), rgba(22, 70, 145, 0.86));
}

.primary-btn:hover:not(:disabled) {
  background: linear-gradient(180deg, rgba(32, 110, 223, 0.92), rgba(22, 70, 145, 0.96));
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(32, 110, 223, 0.3);
}

.ghost-btn:disabled,
.primary-btn:disabled,
input:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .modal-card {
    padding: 16px;
  }
  
  .actions {
    flex-direction: column-reverse;
  }
  
  .ghost-btn,
  .primary-btn {
    width: 100%;
    text-align: center;
  }
  
  .search-result-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .result-badge {
    align-self: flex-start;
  }
}
</style>