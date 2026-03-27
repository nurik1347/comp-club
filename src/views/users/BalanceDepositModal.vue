<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-root" @click.self="close">
      <div class="modal-card">
        <div class="modal-header">
          <h3>{{ modalTitle }}</h3>
          <button type="button" class="icon-btn" @click="close">X</button>
        </div>

        <p class="target-user">{{ user?.fullName || user?.username || 'Foydalanuvchi' }}</p>

        <form class="form-grid" @submit.prevent="handleSubmit">
          <label>
            <span>Miqdor (so'm)</span>
            <input
              v-model="amount"
              type="number"
              :min="mode === 'adjust' ? undefined : 1"
              step="1"
              :placeholder="mode === 'adjust' ? '-5000 yoki 5000' : '50000'"
              :disabled="loading"
            />
          </label>

          <label>
            <span>Izoh</span>
            <textarea
              v-model.trim="description"
              rows="3"
              placeholder="Naqd pul qabul qilindi"
              :disabled="loading"
            ></textarea>
          </label>

          <p v-if="error" class="error-text">{{ error }}</p>

          <div class="actions">
            <button type="button" class="ghost-btn" :disabled="loading" @click="close">
              Bekor qilish
            </button>
            <button type="submit" class="primary-btn" :disabled="loading">
              {{ loading ? 'Yuborilmoqda...' : submitLabel }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  user: {
    type: Object,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  },
  mode: {
    type: String,
    default: 'deposit'
  }
})

const emit = defineEmits(['update:modelValue', 'submit'])

const amount = ref('')
const description = ref('')
const error = ref('')
const modalTitle = computed(() =>
  props.mode === 'adjust' ? "Balansni qo'lda sozlash" : "Balans to'ldirish"
)
const submitLabel = computed(() =>
  props.mode === 'adjust' ? 'Balansni sozlash' : 'Balansga qo`shish'
)

const resetForm = () => {
  amount.value = ''
  description.value = ''
  error.value = ''
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      resetForm()
    }
  },
  { immediate: true }
)

const close = () => {
  emit('update:modelValue', false)
}

const handleSubmit = () => {
  const numericAmount = Number(amount.value)

  if (!props.user?.id) {
    error.value = 'Foydalanuvchi tanlanmagan'
    return
  }

  if (props.mode === 'adjust') {
    if (!Number.isFinite(numericAmount) || numericAmount === 0) {
      error.value = 'Adjust uchun miqdor 0 bo`lmasligi kerak'
      return
    }
  } else if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    error.value = 'Miqdor musbat son bo`lishi kerak'
    return
  }

  error.value = ''

  emit('submit', {
    userId: props.user.id,
    amount: numericAmount,
    description: description.value
  })
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
  margin-bottom: 4px;
}

h3 {
  margin: 0;
  color: #f4f9ff;
}

.target-user {
  margin: 0 0 12px;
  color: #9fc0e8;
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

input,
textarea {
  border-radius: 12px;
  border: 1px solid rgba(128, 188, 255, 0.34);
  background: rgba(11, 33, 69, 0.58);
  color: #eaf4ff;
  padding: 10px 12px;
  outline: none;
}

textarea {
  resize: vertical;
}

input::placeholder,
textarea::placeholder {
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
input:disabled,
textarea:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}
</style>
