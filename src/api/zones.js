import api from './axios'

export const getAllZones = async () => {
  const response = await api.get('/api/zones')
  return response.data
}

export const getZoneById = async (zoneId) => {
  const response = await api.get(`/api/zones/${zoneId}`)
  return response.data
}

export const createZone = async (payload) => {
  const response = await api.post('/api/zones', payload)
  return response.data
}

export const updateZone = async (zoneId, payload) => {
  const response = await api.put(`/api/zones/${zoneId}`, payload)
  return response.data
}

export const deleteZone = async (zoneId) => {
  const response = await api.delete(`/api/zones/${zoneId}`)
  return response.data
}

export default {
  getAllZones,
  getZoneById,
  createZone,
  updateZone,
  deleteZone
}
