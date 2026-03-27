import { defineStore } from 'pinia'
import balanceApi from '@/api/balance'

const readBody = (payload) => payload?.data ?? payload ?? {}

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

export const useBalanceStore = defineStore('balance', {
  state: () => ({
    loading: false,
    lastError: ''
  }),

  actions: {
    async getUserBalance(userId) {
      this.loading = true
      this.lastError = ''

      try {
        const response = await balanceApi.getUserBalance(userId)
        return readBody(response)
      } catch (error) {
        const message = readErrorMessage(error, 'Balansni olib bo`lmadi')
        this.lastError = message
        throw new Error(message)
      } finally {
        this.loading = false
      }
    },

    async depositToUser({ userId, amount, description }) {
      const numericAmount = Number(amount)

      if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        throw new Error('Miqdor musbat son bo`lishi kerak')
      }

      this.loading = true
      this.lastError = ''

      try {
        const payload = {
          userId: Number(userId),
          amount: Math.round(numericAmount),
          description: (description ?? '').toString().trim() || 'Admin deposit'
        }

        const response = await balanceApi.depositBalance(payload)
        return readBody(response)
      } catch (error) {
        const message = readErrorMessage(error, 'Balansni to`ldirib bo`lmadi')
        this.lastError = message
        throw new Error(message)
      } finally {
        this.loading = false
      }
    },

    async adjustUserBalance({ userId, amount, description }) {
      const numericAmount = Number(amount)

      if (!Number.isFinite(numericAmount) || numericAmount === 0) {
        throw new Error('Miqdor 0 bo`lmasligi kerak')
      }

      this.loading = true
      this.lastError = ''

      try {
        const payload = {
          userId: Number(userId),
          amount: Math.round(numericAmount),
          description: (description ?? '').toString().trim() || 'Admin manual adjust'
        }

        const response = await balanceApi.adjustBalance(payload)
        return readBody(response)
      } catch (error) {
        const message = readErrorMessage(error, 'Balansni sozlab bo`lmadi')
        this.lastError = message
        throw new Error(message)
      } finally {
        this.loading = false
      }
    }
  }
})
