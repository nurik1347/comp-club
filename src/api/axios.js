import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

/**
 * Auth endpointlari (login va refresh) uchun token qo‘shilmaydi
 */
const isAuthRequest = (url = '') => {
  return [
    '/api/auth/admin/login',
    '/api/auth/user/login',
    '/api/auth/login',
    '/api/auth/refresh'
  ].some((path) => url.includes(path))
}

// ==================== REQUEST INTERCEPTOR ====================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token && !isAuthRequest(config.url)) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ==================== RESPONSE INTERCEPTOR ====================
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const requestUrl = originalRequest?.url || ''

    // Auth endpointlarida xato bo‘lsa — qayta urinish kerak emas
    if (isAuthRequest(requestUrl)) {
      return Promise.reject(error)
    }

    // 401 va hali retry qilinmagan bo‘lsa → token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (!refreshToken) throw new Error('Refresh token topilmadi')

        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/auth/refresh`,
          { refreshToken }
        )

        const newAccessToken = res.data.accessToken

        // Yangi tokenni saqlash
        localStorage.setItem('accessToken', newAccessToken)

        // Original so‘rovni yangi token bilan qayta yuborish
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        // Refresh ham muvaffaqiyatsiz bo‘lsa — logout
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')

        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api