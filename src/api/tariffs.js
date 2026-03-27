import api from './axios'

const toTariffId = (value) => {
  const tariffId = Number(value)
  if (!Number.isInteger(tariffId) || tariffId <= 0) {
    throw new Error('Tariff ID noto`g`ri')
  }

  return tariffId
}

export const getAllTariffs = async () => {
  const response = await api.get('/api/tariffs')
  return response.data
}

export const getActiveTariffs = async () => {
  const response = await api.get('/api/tariffs/active')
  return response.data
}

export const getTariffById = async (tariffId) => {
  const response = await api.get(`/api/tariffs/${toTariffId(tariffId)}`)
  return response.data
}

export const createTariff = async (payload) => {
  const response = await api.post('/api/tariffs', payload)
  return response.data
}

export const updateTariff = async (tariffId, payload) => {
  const response = await api.put(`/api/tariffs/${toTariffId(tariffId)}`, payload)
  return response.data
}

export const deleteTariff = async (tariffId) => {
  const response = await api.delete(`/api/tariffs/${toTariffId(tariffId)}`)
  return response.data
}

export const toggleTariff = async (tariffId) => {
  const response = await api.patch(`/api/tariffs/${toTariffId(tariffId)}/toggle`)
  return response.data
}

export default {
  getAllTariffs,
  getActiveTariffs,
  getTariffById,
  createTariff,
  updateTariff,
  deleteTariff,
  toggleTariff
}
