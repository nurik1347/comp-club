import { defineStore } from 'pinia'
import authApi from '@/api/auth'

const extractAuthData = (raw = {}) => {
  const payload = raw?.data ?? raw ?? {}
  const tokens = payload?.tokens ?? {}

  return {
    accessToken: payload?.accessToken ?? tokens?.accessToken ?? null,
    refreshToken: payload?.refreshToken ?? tokens?.refreshToken ?? null,
    user: payload?.user ?? null
  }
}

const buildFallbackUser = (username, role = 'user') => ({
  username,
  role
})

const readErrorMessage = (error, fallback = 'Xatolik yuz berdi') => {
  const message = error?.response?.data?.message

  if (Array.isArray(message)) {
    return message.filter(Boolean).join(', ') || fallback
  }

  if (typeof message === 'string' && message.trim()) {
    return message
  }

  return fallback
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    accessToken: localStorage.getItem('accessToken') || null,
    refreshToken: localStorage.getItem('refreshToken') || null,
    isAdmin: localStorage.getItem('role') === 'admin',
    loading: false,
    lastError: ''
  }),

  actions: {
    applySession(authData, username, fallbackRole) {
      if (!authData?.accessToken) return false

      this.accessToken = authData.accessToken
      this.refreshToken = authData.refreshToken || null
      this.user = authData.user || buildFallbackUser(username, fallbackRole)

      const role = (this.user?.role || fallbackRole || 'user').toString().toLowerCase()
      this.isAdmin = role === 'admin'

      localStorage.setItem('accessToken', this.accessToken)

      if (this.refreshToken) {
        localStorage.setItem('refreshToken', this.refreshToken)
      } else {
        localStorage.removeItem('refreshToken')
      }

      localStorage.setItem('role', role)
      return true
    },

    async adminLogin(username, password) {
      this.loading = true
      this.lastError = ''

      try {
        const res = await authApi.adminLogin({ username, password })
        const authData = extractAuthData(res)
        const success = this.applySession(authData, username, 'admin')

        if (success) {
          await this.getMeSafe()
        }

        return success
      } catch (error) {
        this.lastError = readErrorMessage(error, 'Admin login xato')
        return false
      } finally {
        this.loading = false
      }
    },

    async userLogin(username, password) {
      this.loading = true
      this.lastError = ''

      try {
        let res

        try {
          res = await authApi.userLogin({ username, password })
        } catch {
          res = await authApi.fallbackUserLogin({ username, password })
        }

        const authData = extractAuthData(res)
        const success = this.applySession(authData, username, 'user')

        if (success) {
          await this.getMeSafe()
        }

        return success
      } catch (error) {
        this.lastError = readErrorMessage(error, 'User login xato')
        return false
      } finally {
        this.loading = false
      }
    },

    async refreshAccessToken() {
      if (!this.refreshToken) {
        throw new Error('Refresh token topilmadi')
      }

      this.loading = true
      this.lastError = ''

      try {
        const response = await authApi.refreshAccessToken(this.refreshToken)
        const nextAccessToken = response?.accessToken ?? response?.data?.accessToken

        if (!nextAccessToken) {
          throw new Error('Yangi access token kelmadi')
        }

        this.accessToken = nextAccessToken
        localStorage.setItem('accessToken', nextAccessToken)

        return nextAccessToken
      } catch (error) {
        this.lastError = readErrorMessage(error, 'Tokenni yangilab bo`lmadi')
        throw new Error(this.lastError)
      } finally {
        this.loading = false
      }
    },

    async getMe() {
      this.loading = true
      this.lastError = ''

      try {
        const response = await authApi.getMe()
        const me = response?.data ?? response ?? null

        if (!me) {
          throw new Error('Profil ma`lumoti topilmadi')
        }

        this.user = me
        const role = (me?.role || 'user').toString().toLowerCase()
        this.isAdmin = role === 'admin'
        localStorage.setItem('role', role)

        return me
      } catch (error) {
        this.lastError = readErrorMessage(error, 'Profilni olib bo`lmadi')
        throw new Error(this.lastError)
      } finally {
        this.loading = false
      }
    },

    async getMeSafe() {
      try {
        await this.getMe()
      } catch {
        // sessiya tokenlari bor bo'lsa fallback user bilan ishlashda davom etadi
      }
    },

    async logout() {
      try {
        if (this.accessToken) {
          await authApi.logout()
        }
      } catch {
        // logout endpoint xato bersa ham lokal sessiyani yopamiz
      }

      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('role')

      this.user = null
      this.accessToken = null
      this.refreshToken = null
      this.isAdmin = false
      this.lastError = ''
    }
  }
})
