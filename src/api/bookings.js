import api from './axios'

export const getAllBookings = async () => {
  const response = await api.get('/api/bookings')
  return response.data
}

export const createBooking = async (payload) => {
  const response = await api.post('/api/bookings', payload)
  return response.data
}

export const getMyBookings = async () => {
  const response = await api.get('/api/bookings/my')
  return response.data
}

export const cancelBooking = async (bookingId) => {
  const response = await api.delete(`/api/bookings/${bookingId}`)
  return response.data
}

export const confirmBooking = async (bookingId) => {
  const response = await api.patch(`/api/bookings/${bookingId}/confirm`)
  return response.data
}

export default {
  getAllBookings,
  createBooking,
  getMyBookings,
  cancelBooking,
  confirmBooking
}
