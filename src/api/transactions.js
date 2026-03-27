import api from './axios'

const toTransactionId = (value) => {
  const transactionId = Number(value)
  if (!Number.isInteger(transactionId) || transactionId <= 0) {
    throw new Error('Transaction ID noto`g`ri')
  }

  return transactionId
}

const sanitizeParams = (params = {}) => {
  const next = {}

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    next[key] = value
  })

  return next
}

export const getAllTransactions = async (params = {}) => {
  const response = await api.get('/api/transactions', { params: sanitizeParams(params) })
  return response.data
}

export const getTransactionById = async (transactionId) => {
  const response = await api.get(`/api/transactions/${toTransactionId(transactionId)}`)
  return response.data
}

export const getMyTransactions = async (params = {}) => {
  const response = await api.get('/api/transactions/my', { params: sanitizeParams(params) })
  return response.data
}

export const createTransaction = async (payload) => {
  const response = await api.post('/api/transactions', payload ?? {})
  return response.data
}

export const updateTransaction = async (transactionId, payload) => {
  const response = await api.put(`/api/transactions/${toTransactionId(transactionId)}`, payload ?? {})
  return response.data
}

export const deleteTransaction = async (transactionId) => {
  const response = await api.delete(`/api/transactions/${toTransactionId(transactionId)}`)
  return response.data
}

export default {
  getAllTransactions,
  getTransactionById,
  getMyTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction
}
