import { defineStore } from 'pinia'
import usersApi from '@/api/users'

const asNumber = (value, fallback = 0) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

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

const normalizeUser = (raw = {}) => {
  const id = raw.id ?? raw.userId ?? raw.user_id ?? null
  const balance = asNumber(raw.balance ?? raw.currentBalance ?? raw.walletBalance, 0)

  const explicitActive = raw.isActive ?? raw.is_active
  const explicitBlocked = raw.isBlocked ?? raw.is_blocked

  const isActive = typeof explicitActive === 'boolean' ? explicitActive : true
  const isBlocked = typeof explicitBlocked === 'boolean' ? explicitBlocked : false
  const isOnline = Boolean(
    raw.isOnline ??
      raw.is_online ??
      raw.loggedIn ??
      raw.is_logged_in ??
      raw.hasActiveSession ??
      raw.has_active_session
  )
  const lastLoginAt = raw.lastLoginAt ?? raw.last_login_at ?? null
  const hasLoginHistory = Boolean(raw.hasLoginHistory ?? raw.has_login_history ?? lastLoginAt)
  const hasLoginSignal = [
    raw.isOnline,
    raw.is_online,
    raw.loggedIn,
    raw.is_logged_in,
    raw.hasActiveSession,
    raw.has_active_session,
    raw.lastLoginAt,
    raw.last_login_at,
    raw.hasLoginHistory,
    raw.has_login_history
  ].some((value) => value !== undefined && value !== null && value !== '')

  return {
    id,
    username: raw.username ?? '',
    fullName: raw.fullName ?? raw.full_name ?? raw.name ?? '',
    phone: raw.phone ?? '',
    role: raw.role ?? 'user',
    balance,
    isActive,
    isBlocked,
    isOnline,
    lastLoginAt,
    hasLoginHistory,
    hasLoginSignal,
    createdAt: raw.createdAt ?? raw.created_at ?? null,
    updatedAt: raw.updatedAt ?? raw.updated_at ?? null
  }
}

const parseUsersPayload = (payload, fallbackPage, fallbackLimit) => {
  const body = readBody(payload)

  let items = []

  if (Array.isArray(body)) {
    items = body
  } else if (Array.isArray(body.users)) {
    items = body.users
  } else if (Array.isArray(body.items)) {
    items = body.items
  } else if (Array.isArray(body.results)) {
    items = body.results
  }

  const paginationSource = body.pagination ?? body.meta ?? {}

  const page = asNumber(
    paginationSource.page ?? paginationSource.currentPage ?? body.page,
    fallbackPage
  )

  const limit = asNumber(
    paginationSource.limit ?? paginationSource.perPage ?? body.limit,
    fallbackLimit
  )

  const total = asNumber(
    paginationSource.total ?? paginationSource.totalItems ?? body.total,
    items.length
  )

  const totalPages = asNumber(
    paginationSource.totalPages,
    Math.max(1, Math.ceil(total / Math.max(limit, 1)))
  )

  return {
    users: items.map(normalizeUser),
    page,
    limit,
    total,
    totalPages
  }
}

export const useUserStore = defineStore('users', {
  state: () => ({
    users: [],
    filters: {
      search: ''
    },
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 1
    },
    loading: false,
    submitting: false,
    lastError: ''
  }),

  actions: {
    setSearch(value) {
      this.filters.search = (value ?? '').toString().trim()
    },

    async fetchUsers(options = {}) {
      this.loading = true
      this.lastError = ''

      const page = asNumber(options.page, this.pagination.page)
      const limit = asNumber(options.limit, this.pagination.limit)
      const search = (options.search ?? this.filters.search ?? '').toString().trim()

      try {
        const payload = await usersApi.getUsers({ page, limit, search })
        const parsed = parseUsersPayload(payload, page, limit)

        this.users = parsed.users
        this.filters.search = search
        this.pagination.page = parsed.page
        this.pagination.limit = parsed.limit
        this.pagination.total = parsed.total
        this.pagination.totalPages = parsed.totalPages

        return parsed.users
      } catch (error) {
        const message = readErrorMessage(error, 'Foydalanuvchilarni yuklab bo`lmadi')
        this.lastError = message
        throw new Error(message)
      } finally {
        this.loading = false
      }
    },

    async createUser(payload) {
      this.submitting = true
      this.lastError = ''

      try {
        const response = await usersApi.createUser(payload)
        await this.fetchUsers({
          page: this.pagination.page,
          limit: this.pagination.limit,
          search: this.filters.search
        })
        return readBody(response)
      } catch (error) {
        const message = readErrorMessage(error, 'Foydalanuvchi yaratib bo`lmadi')
        this.lastError = message
        throw new Error(message)
      } finally {
        this.submitting = false
      }
    },

    async updateUser(userId, payload) {
      this.submitting = true
      this.lastError = ''

      try {
        const response = await usersApi.updateUser(userId, payload)
        await this.fetchUsers({
          page: this.pagination.page,
          limit: this.pagination.limit,
          search: this.filters.search
        })
        return readBody(response)
      } catch (error) {
        const message = readErrorMessage(error, 'Foydalanuvchini yangilab bo`lmadi')
        this.lastError = message
        throw new Error(message)
      } finally {
        this.submitting = false
      }
    },

    async deleteUser(userId) {
      this.submitting = true
      this.lastError = ''

      try {
        const response = await usersApi.deleteUser(userId)

        const isLastRowOnPage = this.users.length === 1 && this.pagination.page > 1
        const nextPage = isLastRowOnPage ? this.pagination.page - 1 : this.pagination.page

        await this.fetchUsers({
          page: nextPage,
          limit: this.pagination.limit,
          search: this.filters.search
        })

        return readBody(response)
      } catch (error) {
        const message = readErrorMessage(error, 'Foydalanuvchini o`chirib bo`lmadi')
        this.lastError = message
        throw new Error(message)
      } finally {
        this.submitting = false
      }
    },

    async toggleBlockUser(userId) {
      this.submitting = true
      this.lastError = ''

      try {
        const response = await usersApi.toggleUserBlock(userId)
        await this.fetchUsers({
          page: this.pagination.page,
          limit: this.pagination.limit,
          search: this.filters.search
        })
        return readBody(response)
      } catch (error) {
        const message = readErrorMessage(error, 'User holatini o`zgartirib bo`lmadi')
        this.lastError = message
        throw new Error(message)
      } finally {
        this.submitting = false
      }
    }
  }
})
