<template>
  <div class="login-screen">
    <div class="screen-glow left"></div>
    <div class="screen-glow right"></div>
    <div class="screen-grid"></div>

    <section class="login-panel">
      <p class="panel-kicker">CompRoom Admin Access</p>
      <h1>WELCOME</h1>
      <p class="panel-subtitle">Kompyuter xonani boshqarish uchun tizimga kiring</p>

      <form class="login-form" @submit.prevent="handleLogin">
        <label class="field-label" for="username">Username</label>
        <div class="input-wrap">
          <span class="input-icon">ID</span>
          <input
            id="username"
            v-model.trim="username"
            type="text"
            autocomplete="username"
            placeholder="admin"
            :disabled="loading"
          />
        </div>

        <label class="field-label" for="password">Password</label>
        <div class="input-wrap">
          <span class="input-icon">PW</span>
          <input
            id="password"
            v-model="password"
            type="password"
            autocomplete="current-password"
            placeholder="Parolni kiriting"
            :disabled="loading"
          />
        </div>

        <button type="submit" class="login-btn" :disabled="loading">
          {{ loading ? 'KIRILMOQDA...' : 'KIRISH' }}
        </button>

        <p v-if="error" class="error-text">{{ error }}</p>
      </form>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  if (!username.value || !password.value) {
    error.value = 'Username va parolni toliq kiriting'
    return
  }

  error.value = ''
  loading.value = true

  let success = await authStore.adminLogin(username.value, password.value)

  if (success) {
    loading.value = false
    ElMessage.success('Admin panelga kirdingiz')
    router.push('/')
    return
  }

  success = await authStore.userLogin(username.value, password.value)

  loading.value = false

  if (success) {
    ElMessage.success('Foydalanuvchi sifatida kirdingiz')
    router.push('/profile')
    return
  }

  error.value = 'Username yoki parol notogri'
}
</script>

<style scoped>
.login-screen {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 28px 16px;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(1200px 600px at 22% 6%, rgba(42, 119, 255, 0.32), transparent 65%),
    radial-gradient(900px 600px at 86% 24%, rgba(0, 179, 255, 0.27), transparent 65%),
    linear-gradient(160deg, #050811, #040f23 45%, #050b19);
}

.screen-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(85, 147, 255, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(85, 147, 255, 0.1) 1px, transparent 1px);
  background-size: 38px 38px;
  opacity: 0.16;
  pointer-events: none;
}

.screen-glow {
  position: absolute;
  width: 480px;
  height: 480px;
  border-radius: 50%;
  filter: blur(110px);
  pointer-events: none;
}

.screen-glow.left {
  background: rgba(0, 156, 255, 0.55);
  left: -180px;
  top: 140px;
}

.screen-glow.right {
  background: rgba(37, 102, 255, 0.45);
  right: -150px;
  bottom: -120px;
}

.login-panel {
  width: min(440px, 100%);
  border-radius: 28px;
  padding: 30px 26px;
  background: linear-gradient(180deg, rgba(6, 17, 38, 0.94), rgba(7, 17, 37, 0.82));
  border: 1px solid rgba(120, 190, 255, 0.4);
  box-shadow:
    0 0 0 1px rgba(150, 209, 255, 0.14) inset,
    0 35px 70px rgba(0, 0, 0, 0.58),
    0 0 28px rgba(38, 122, 255, 0.28);
  position: relative;
  z-index: 1;
}

.panel-kicker {
  margin: 0;
  letter-spacing: 2.4px;
  text-transform: uppercase;
  font-size: 11px;
  color: #9ec6ff;
}

h1 {
  margin: 8px 0 6px;
  color: #f4f8ff;
  letter-spacing: 4px;
  font-size: 40px;
  font-weight: 700;
}

.panel-subtitle {
  margin: 0 0 20px;
  color: #9fb5d3;
  font-size: 14px;
}

.login-form {
  display: grid;
  gap: 11px;
}

.field-label {
  color: #aac5e8;
  font-size: 12px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
}

.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
  overflow: hidden;
  border-radius: 14px;
  background:
    radial-gradient(circle at 12% 50%, rgba(87, 188, 255, 0.22), transparent 45%),
    radial-gradient(circle at 90% 50%, rgba(43, 112, 255, 0.18), transparent 42%),
    linear-gradient(165deg, rgba(14, 36, 72, 0.9), rgba(9, 24, 50, 0.95));
  border: 1px solid rgba(130, 194, 255, 0.38);
  box-shadow:
    0 0 0 1px rgba(173, 225, 255, 0.1) inset,
    0 10px 20px rgba(6, 18, 44, 0.35);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.input-wrap::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(192, 237, 255, 0.8), transparent);
  opacity: 0.55;
}

.input-wrap:focus-within {
  border-color: rgba(148, 210, 255, 0.82);
  box-shadow:
    0 0 0 1px rgba(173, 225, 255, 0.22) inset,
    0 0 18px rgba(48, 151, 255, 0.35),
    0 10px 24px rgba(8, 24, 56, 0.46);
  transform: translateY(-1px);
}

.input-icon {
  width: 46px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  font-size: 12px;
  letter-spacing: 1px;
  color: #b9dcff;
  background: linear-gradient(180deg, rgba(40, 98, 187, 0.28), rgba(18, 44, 87, 0.24));
  border-right: 1px solid rgba(146, 205, 255, 0.24);
}

input {
  width: 100%;
  height: 50px;
  border: 0;
  outline: 0;
  appearance: none;
  padding: 0 14px;
  background: transparent;
  color: #ecf4ff;
  -webkit-text-fill-color: #ecf4ff;
  caret-color: #ecf4ff;
  color-scheme: dark;
  font-size: 15px;
}

input::placeholder {
  color: #84a3c9;
}

input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
input:-webkit-autofill:active {
  -webkit-text-fill-color: #ecf4ff !important;
  caret-color: #ecf4ff;
  border: 0;
  -webkit-box-shadow: 0 0 0 1000px rgba(12, 31, 62, 0.96) inset !important;
  box-shadow: 0 0 0 1000px rgba(12, 31, 62, 0.96) inset !important;
  transition: background-color 9999s ease-out 0s;
}

.login-btn {
  margin-top: 12px;
  border: 1px solid rgba(138, 200, 255, 0.72);
  border-radius: 999px;
  height: 50px;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 1.8px;
  color: #f4fbff;
  background: linear-gradient(180deg, #2aa6ff, #176ef0);
  cursor: pointer;
  transition: transform 0.2s ease, filter 0.2s ease;
  box-shadow: 0 18px 34px rgba(22, 114, 255, 0.38);
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  filter: brightness(1.08);
}

.login-btn:disabled {
  cursor: not-allowed;
  opacity: 0.76;
}

.error-text {
  margin: 8px 0 0;
  color: #ff8d8d;
  font-size: 13px;
}

@media (max-width: 580px) {
  .login-panel {
    padding: 24px 18px;
    border-radius: 20px;
  }

  h1 {
    font-size: 32px;
    letter-spacing: 3px;
  }
}
</style>
