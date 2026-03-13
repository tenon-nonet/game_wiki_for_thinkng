const AUTH_CHANGED_EVENT = 'auth-changed'

export const getToken = () => localStorage.getItem('token')
export const getUsername = () => localStorage.getItem('username')
export const getRole = () => localStorage.getItem('role')
export const isLoggedIn = () => !!getToken()
export const isAdmin = () => getRole() === 'ADMIN'

const notifyAuthChanged = () => {
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT))
}

export const onAuthChanged = (listener: () => void) => {
  window.addEventListener(AUTH_CHANGED_EVENT, listener)
  return () => window.removeEventListener(AUTH_CHANGED_EVENT, listener)
}

export const saveAuth = (token: string, username: string, role: string) => {
  localStorage.setItem('token', token)
  localStorage.setItem('username', username)
  localStorage.setItem('role', role)
  notifyAuthChanged()
}

export const clearAuth = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('username')
  localStorage.removeItem('role')
  notifyAuthChanged()
}
