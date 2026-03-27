import api from './axios'

export const adminLogin = async (payload) => {
  const response = await api.post('/api/auth/admin/login', payload)
  return response.data
}

export const userLogin = async (payload) => {
  const response = await api.post('/api/auth/user/login', payload)
  return response.data
}

export const fallbackUserLogin = async (payload) => {
  const response = await api.post('/api/auth/login', payload)
  return response.data
}

export const refreshAccessToken = async (refreshToken) => {
  const response = await api.post('/api/auth/refresh', { refreshToken })
  return response.data
}

export const getMe = async () => {
  const response = await api.get('/api/auth/me')
  return response.data
}

export const logout = async () => {
  const response = await api.post('/api/auth/logout')
  return response.data
}

export default {
  adminLogin,
  userLogin,
  fallbackUserLogin,
  refreshAccessToken,
  getMe,
  logout
}
