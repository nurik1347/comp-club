import { io } from 'socket.io-client'

let socket = null

/**
 * Socket.io ni ishga tushirish (faqat bitta marta)
 */
export const initSocket = () => {
  if (socket?.connected) return socket

  const token = localStorage.getItem('accessToken')

  socket = io(import.meta.env.VITE_API_URL, {
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 10000
  })

  console.log('🔌 Socket init qilindi')

  return socket
}

export const getSocket = () => socket

/**
 * Eventga obuna bo‘lish (avtomatik unsubscribe qaytaradi)
 */
export const onSocketEvent = (eventName, callback) => {
  if (!socket) return () => {}

  socket.on(eventName, callback)

  // Unsubscribe funksiyasi
  return () => socket.off(eventName, callback)
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
    console.log('🔌 Socket uzildi')
  }
}