import api from './axios'

export const getAllComputers = async () => {
  const response = await api.get('/api/computers')
  return response.data
}

export const getAvailableComputers = async () => {
  const response = await api.get('/api/computers/available')
  return response.data
}

export const getComputersMap = async () => {
  const response = await api.get('/api/computers/map')
  return response.data
}

export const getComputerById = async (computerId) => {
  const response = await api.get(`/api/computers/${computerId}`)
  return response.data
}

export const createComputer = async (payload) => {
  const response = await api.post('/api/computers', payload)
  return response.data
}

export const updateComputer = async (computerId, payload) => {
  const response = await api.put(`/api/computers/${computerId}`, payload)
  return response.data
}

export const deleteComputer = async (computerId) => {
  const response = await api.delete(`/api/computers/${computerId}`)
  return response.data
}

export const updateComputerStatus = async (computerId, status) => {
  const response = await api.patch(`/api/computers/${computerId}/status`, { status })
  return response.data
}

export default {
  getAllComputers,
  getAvailableComputers,
  getComputersMap,
  getComputerById,
  createComputer,
  updateComputer,
  deleteComputer,
  updateComputerStatus
}
