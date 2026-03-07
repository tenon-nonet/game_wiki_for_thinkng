export const getToken = () => localStorage.getItem('token')
export const getUsername = () => localStorage.getItem('username')
export const getRole = () => localStorage.getItem('role')
export const isLoggedIn = () => !!getToken()
export const isAdmin = () => getRole() === 'ADMIN'

export const saveAuth = (token: string, username: string, role: string) => {
  localStorage.setItem('token', token)
  localStorage.setItem('username', username)
  localStorage.setItem('role', role)
}

export const clearAuth = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('username')
  localStorage.removeItem('role')
}
