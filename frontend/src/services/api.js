/**
 * Centralized API client for the Fraud Intelligence Platform.
 */

import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

// --- API Methods ---

export const getHealth = async () => {
  const response = await api.get('/health')
  return response.data
}

export const getDashboardSummary = async () => {
  const response = await api.get('/dashboard/summary')
  return response.data
}

export const predictTransaction = async (transactionData) => {
  const response = await api.post('/predict', transactionData)
  return response.data
}

export const createTransaction = async (transactionData) => {
  const response = await api.post('/transactions', transactionData)
  return response.data
}

export const getTransactions = async (params = {}) => {
  const response = await api.get('/transactions', { params })
  return response.data
}

export const getTransactionDetail = async (transactionId) => {
  const response = await api.get(`/transactions/${transactionId}`)
  return response.data
}

export const getAlerts = async (params = {}) => {
  const response = await api.get('/alerts', { params })
  return response.data
}

export const updateAlertStatus = async (transactionId, reviewStatus) => {
  const response = await api.patch(`/alerts/${transactionId}/status`, {
    review_status: reviewStatus,
  })
  return response.data
}

export const getAnalytics = async (days = 14) => {
  const response = await api.get('/analytics', { params: { days } })
  return response.data
}

export const getModelMetrics = async () => {
  const response = await api.get('/model/metrics')
  return response.data
}

export const getModelInfo = async () => {
  const response = await api.get('/model/info')
  return response.data
}

export default api
