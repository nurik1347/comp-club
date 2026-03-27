import api from './axios'

const toSessionId = (value) => {
  const sessionId = Number(value)
  if (!Number.isInteger(sessionId) || sessionId <= 0) {
    throw new Error('Session ID noto`g`ri')
  }

  return sessionId
}

const sanitizeParams = (params = {}) => {
  const next = {}

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    next[key] = value
  })

  return next
}

export const getAllSessions = async (params = {}) => {
  const response = await api.get('/api/sessions', { params: sanitizeParams(params) })
  return response.data
}

export const getActiveSessions = async () => {
  const response = await api.get('/api/sessions/active')
  return response.data
}

export const getSessionById = async (sessionId) => {
  const response = await api.get(`/api/sessions/${toSessionId(sessionId)}`)
  return response.data
}

export const startSession = async (payload) => {
  const response = await api.post('/api/sessions/start', payload ?? {})
  return response.data
}

export const endSession = async (sessionId) => {
  const response = await api.post(`/api/sessions/${toSessionId(sessionId)}/end`)
  return response.data
}

export const getSessionCost = async (sessionId) => {
  const response = await api.get(`/api/sessions/${toSessionId(sessionId)}/cost`)
  return response.data
}

export const getMySessions = async () => {
  const response = await api.get('/api/sessions/my')
  return response.data
}

export const getMyActiveSession = async () => {
  const response = await api.get('/api/sessions/my/active')
  return response.data
}

export default {
  getAllSessions,
  getActiveSessions,
  getSessionById,
  startSession,
  endSession,
  getSessionCost,
  getMySessions,
  getMyActiveSession
}
