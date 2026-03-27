<template>
  <section class="page-wrap">
    <article class="panel">
      <div class="title-row">
        <div>
          <h2>WebSocket (Socket.io)</h2>
          <p>session:started / session:ended / computer:status_changed / balance:low / balance:depleted</p>
        </div>

        <div class="actions">
          <button type="button" class="btn" @click="connectSocket">Connect</button>
          <button type="button" class="btn danger" @click="disconnect">Disconnect</button>
          <button type="button" class="btn" @click="clearLogs">Tozalash</button>
        </div>
      </div>

      <p class="status-line">
        Holat: 
        <strong :class="{ connected: connected, disconnected: !connected }">
          {{ connected ? 'Ulangan ✅' : 'Ulanmagan ❌' }}
        </strong>
      </p>
    </article>

    <article class="panel">
      <h3>Event log (real-time)</h3>
      <div v-if="!logs.length" class="empty-box">Hozircha hech qanday event yo‘q.<br>Connect tugmasini bosing va boshqa sahifada sessiya oching.</div>
      <pre v-else class="json-box">{{ pretty(logs) }}</pre>
    </article>
  </section>
</template>

<script setup>
import { onBeforeUnmount, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { initSocket, getSocket, onSocketEvent, disconnectSocket } from '@/api/socket'

const connected = ref(false)
const logs = ref([])

const eventNames = [
  'session:started',
  'session:ended',
  'computer:status_changed',
  'balance:low',
  'balance:depleted'
]

const unsubs = []

const pretty = (value) => JSON.stringify(value, null, 2)

const pushLog = (event, payload) => {
  logs.value.unshift({
    time: new Date().toLocaleTimeString('uz-UZ'),
    event,
    payload: payload || {}
  })

  if (logs.value.length > 100) logs.value.pop()
}

const unsubscribeAll = () => {
  while (unsubs.length) {
    unsubs.pop()()
  }
}

const bindEvents = () => {
  unsubscribeAll()

  eventNames.forEach((event) => {
    const unsubscribe = onSocketEvent(event, (payload) => {
      pushLog(event, payload)
      ElMessage.info(`Event: ${event}`)
    })
    unsubs.push(unsubscribe)
  })

  const socket = getSocket()
  if (socket) {
    socket.on('connect', () => {
      connected.value = true
      pushLog('connect', { socketId: socket.id })
    })

    socket.on('disconnect', (reason) => {
      connected.value = false
      pushLog('disconnect', { reason })
    })

    socket.on('connect_error', (err) => {
      connected.value = false
      pushLog('connect_error', { message: err.message })
    })
  }
}

const connectSocket = () => {
  try {
    initSocket()
    bindEvents()

    // Birinchi marta ulanish holatini tekshirish
    const socket = getSocket()
    if (socket?.connected) {
      connected.value = true
      pushLog('connect', { socketId: socket.id })
    }

    ElMessage.success('Socket.io muvaffaqiyatli ulandi!')
  } catch (error) {
    ElMessage.error('Socket ulanishda xatolik yuz berdi')
    console.error(error)
  }
}

const disconnect = () => {
  disconnectSocket()
  connected.value = false
  unsubscribeAll()
  ElMessage.success('Socket uzildi')
}

const clearLogs = () => {
  logs.value = []
}

onBeforeUnmount(() => {
  unsubscribeAll()
  disconnectSocket()
})
</script>

<style scoped>
.page-wrap {
  display: grid;
  gap: 14px;
  padding: 20px;
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
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 12px;
}

h2, h3 {
  margin: 0;
  color: #f4f9ff;
}

p {
  margin: 8px 0 0;
  color: #a8bfdc;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.btn {
  border-radius: 10px;
  padding: 9px 14px;
  border: 1px solid rgba(131, 191, 255, 0.45);
  background: rgba(20, 50, 99, 0.54);
  color: #e4f1ff;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:hover {
  background: rgba(30, 70, 130, 0.8);
}

.btn.danger {
  border-color: rgba(255, 100, 100, 0.6);
  background: rgba(140, 40, 40, 0.6);
  color: #ffd0d0;
}

.status-line {
  margin-top: 12px;
  font-size: 15px;
}

.connected { color: #4ade80; }
.disconnected { color: #f87171; }

.empty-box {
  margin-top: 14px;
  border: 1px dashed rgba(133, 192, 255, 0.3);
  border-radius: 14px;
  padding: 24px;
  text-align: center;
  color: #a9c1e0;
  background: rgba(13, 35, 72, 0.3);
}

.json-box {
  margin: 12px 0 0;
  border-radius: 12px;
  border: 1px solid rgba(133, 191, 255, 0.28);
  background: rgba(7, 20, 42, 0.74);
  padding: 14px;
  font-size: 12.5px;
  line-height: 1.5;
  color: #c7dcf7;
  max-height: 520px;
  overflow: auto;
  white-space: pre;
}
</style>