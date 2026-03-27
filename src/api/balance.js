import api from './axios'

export const getUserBalance = async (userId) => {
  const response = await api.get(`/api/balance/${userId}`)
  return response.data
}

export const depositBalance = async (payload) => {
  const response = await api.post('/api/balance/deposit', payload)
  return response.data
}

export const adjustBalance = async (payload) => {
  const response = await api.post('/api/balance/adjust', payload)
  return response.data
}

export const getMyBalance = async () => {
  const response = await api.get('/api/balance/my')
  return response.data
}

export default {
  getUserBalance,
  depositBalance,
  adjustBalance,
  getMyBalance
}
