import api from './axios'

export const getDailyReport = async () => {
  const response = await api.get('/api/reports/daily')
  return response.data
}

export const getWeeklyReport = async () => {
  const response = await api.get('/api/reports/weekly')
  return response.data
}

export const getMonthlyReport = async () => {
  const response = await api.get('/api/reports/monthly')
  return response.data
}

export const getComputersStats = async () => {
  const response = await api.get('/api/reports/computers')
  return response.data
}

export const getTopUsers = async () => {
  const response = await api.get('/api/reports/top-users')
  return response.data
}

export const getRevenueChart = async () => {
  const response = await api.get('/api/reports/revenue')
  return response.data
}

export default {
  getDailyReport,
  getWeeklyReport,
  getMonthlyReport,
  getComputersStats,
  getTopUsers,
  getRevenueChart
}
