const BASE = ''

function getToken() { return localStorage.getItem('token') }

async function request(path: string, options: any = {}) {
  const headers: any = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers['Authorization'] = 'Bearer ' + token
  const res = await fetch(BASE + path, { ...options, headers })
  if (res.status === 401) { localStorage.removeItem('token'); window.location.href = '/'; throw new Error('未登录') }
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || '请求失败')
  return data
}

export const api = {
  login: (username: string, password: string) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),

  getMe: () => request('/api/auth/me'),

  getRooms: () => request('/api/rooms'),
  createRoom: (data: any) => request('/api/rooms', { method: 'POST', body: JSON.stringify(data) }),
  updateRoom: (id: number, data: any) => request('/api/rooms/' + id, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRoom: (id: number) => request('/api/rooms/' + id, { method: 'DELETE' }),

  getPersona: (roomId: number) => request('/api/rooms/' + roomId + '/persona'),
  savePersona: (roomId: number, data: any) => request('/api/rooms/' + roomId + '/persona', { method: 'PUT', body: JSON.stringify(data) }),

  getAiSettings: (roomId: number) => request('/api/rooms/' + roomId + '/ai-settings'),
  saveAiSettings: (roomId: number, data: any) => request('/api/rooms/' + roomId + '/ai-settings', { method: 'PUT', body: JSON.stringify(data) }),

  getUsers: () => request('/api/users'),
  createUser: (data: any) => request('/api/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id: number, data: any) => request('/api/users/' + id, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (id: number) => request('/api/users/' + id, { method: 'DELETE' }),

  register: (username: string, password: string, isAdmin: boolean) =>
    request('/api/auth/register', { method: 'POST', body: JSON.stringify({ username, password, isAdmin }) }),
}