import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const api = axios.create({
  baseURL: API_BASE,
})

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth-storage')
  if (token) {
    try {
      const auth = JSON.parse(token).state
      if (auth.token) {
        config.headers.Authorization = `Bearer ${auth.token}`
      }
    } catch {
      // Token not found or invalid
    }
  }
  return config
})

export const authAPI = {
  login: (email, password, workspaceId) =>
    api.post('/api/auth/token', { email, password, workspaceId }),
  verify: () => api.get('/api/auth/verify'),
}

export const subscribersAPI = {
  list: (workspaceId, params) =>
    api.get(`/api/clients/${workspaceId}/subscribers`, { params }),
  create: (workspaceId, data) =>
    api.post(`/api/clients/${workspaceId}/subscribers`, data),
}

export const campaignsAPI = {
  list: (workspaceId, params) =>
    api.get(`/api/clients/${workspaceId}/campaigns`, { params }),
  create: (workspaceId, data) =>
    api.post(`/api/clients/${workspaceId}/campaigns`, data),
}

export const listsAPI = {
  list: (workspaceId) =>
    api.get(`/api/clients/${workspaceId}/subscriber-lists`),
  create: (workspaceId, data) =>
    api.post(`/api/clients/${workspaceId}/subscriber-lists`, data),
}

export default api
