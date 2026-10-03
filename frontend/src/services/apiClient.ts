export const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

export const apiClient = {
  get: async (endpoint: string) => {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store'
  })

  return response
},

  post: async (endpoint: string, body?: unknown) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined
    })

    return response
  },

  patch: async (endpoint: string, body?: unknown) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined
    })

    return response
  },

  delete: async (endpoint: string) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      credentials: 'include'
    })

    return response
  }
}