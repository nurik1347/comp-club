import api from './axios'

export const getUsers = async (params = {}) => {
  const response = await api.get('/api/users', { params })
  return response.data
}

export const getUserById = async (userId) => {
  const response = await api.get(`/api/users/${userId}`)
  return response.data
}

export const createUser = async (payload) => {
  const response = await api.post('/api/users', payload)
  return response.data
}

export const updateUser = async (userId, payload) => {
  const response = await api.put(`/api/users/${userId}`, payload)
  return response.data
}

export const deleteUser = async (userId) => {
  const response = await api.delete(`/api/users/${userId}`)
  return response.data
}

export const toggleUserBlock = async (userId) => {
  const response = await api.post(`/api/users/${userId}/block`)
  return response.data
}

export const getUserSessions = async (userId) => {
  const response = await api.get(`/api/users/${userId}/sessions`)
  return response.data
}

export const getUserTransactions = async (userId) => {
  const response = await api.get(`/api/users/${userId}/transactions`)
  return response.data
}

export const getMyProfile = async () => {
  const response = await api.get('/api/users/profile')
  return response.data
}

export const updateMyProfile = async (payload) => {
  const response = await api.put('/api/users/profile', payload)
  return response.data
}

export default {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserBlock,
  getUserSessions,
  getUserTransactions,
  getMyProfile,
  updateMyProfile
}
