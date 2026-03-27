import { io } from 'socket.io-client'

let socket = null

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


export const onSocketEvent = (eventName, callback) => {
  if (!socket) return () => {}

  socket.on(eventName, callback)
  return () => socket.off(eventName, callback)
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
    console.log('🔌 Socket uzildi')
  }
}