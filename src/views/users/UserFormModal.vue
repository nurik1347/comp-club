<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-root" @click.self="close">
      <div class="modal-card">
        <div class="modal-header">
          <h3>{{ isEditMode ? 'Foydalanuvchini tahrirlash' : 'Yangi foydalanuvchi' }}</h3>
          <button type="button" class="icon-btn" @click="close">X</button>
        </div>

        <form class="form-grid" @submit.prevent="handleSubmit">
          <label>
            <span>Username</span>
            <input
              v-model.trim="form.username"
              type="text"
              placeholder="username"
              :disabled="loading"
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
import { computed, reactive, watch } from 'vue'

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
}

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
  background: rgba(3, 8, 20, 0.75);
  display: grid;
  place-items: center;
  padding: 18px;
}

.modal-card {
  width: min(520px, 100%);
  border-radius: 18px;
  border: 1px solid rgba(125, 190, 255, 0.32);
  background: linear-gradient(145deg, rgba(8, 20, 44, 0.95), rgba(10, 27, 59, 0.8));
  box-shadow: 0 24px 50px rgba(2, 10, 24, 0.6);
  padding: 18px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

h3 {
  margin: 0;
  color: #f4f9ff;
}

.icon-btn {
  border: 1px solid rgba(129, 189, 255, 0.45);
  background: rgba(14, 39, 80, 0.6);
  color: #dceeff;
  border-radius: 10px;
  width: 34px;
  height: 34px;
  cursor: pointer;
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

input::placeholder {
  color: #7e9ec4;
}

.error-text {
  margin: 0;
  color: #ff9f9f;
  font-size: 13px;
}

.actions {
  margin-top: 4px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.ghost-btn,
.primary-btn {
  border-radius: 10px;
  padding: 10px 14px;
  font-weight: 600;
  cursor: pointer;
}

.ghost-btn {
  border: 1px solid rgba(131, 191, 255, 0.45);
  background: rgba(20, 50, 99, 0.54);
  color: #e4f1ff;
}

.primary-btn {
  border: 1px solid rgba(131, 191, 255, 0.55);
  color: #f4f8ff;
  background: linear-gradient(180deg, rgba(32, 110, 223, 0.82), rgba(22, 70, 145, 0.86));
}

.ghost-btn:disabled,
.primary-btn:disabled,
input:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}
</style>
