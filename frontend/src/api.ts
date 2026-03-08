import axios from 'axios'
import type { AuthResponse, Game, Item, Tag } from './types'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auth
export const register = (username: string, password: string, email: string) =>
  api.post<AuthResponse>('/auth/register', { username, password, email })

export const login = (username: string, password: string) =>
  api.post<AuthResponse>('/auth/login', { username, password })

// Games
export const getGames = (name?: string) =>
  api.get<Game[]>('/games', { params: name ? { name } : {} })

export const getGame = (id: number) =>
  api.get<Game>(`/games/${id}`)

export const createGame = (name: string, description: string, image?: File | null) => {
  const data = new FormData()
  data.append('data', new Blob([JSON.stringify({ name, description })], { type: 'application/json' }))
  if (image) data.append('image', image)
  return api.post<Game>('/games', data, { headers: { 'Content-Type': 'multipart/form-data' } })
}

export const updateGame = (id: number, name: string, description: string, image?: File | null) => {
  const data = new FormData()
  data.append('data', new Blob([JSON.stringify({ name, description })], { type: 'application/json' }))
  if (image) data.append('image', image)
  return api.put<Game>(`/games/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } })
}

export const deleteGame = (id: number) =>
  api.delete(`/games/${id}`)

// Items
export const getItems = (gameId?: number, tag?: string, keyword?: string) =>
  api.get<Item[]>('/items', { params: { ...(gameId ? { gameId } : {}), ...(tag ? { tag } : {}), ...(keyword ? { keyword } : {}) } })

export const getItem = (id: number) =>
  api.get<Item>(`/items/${id}`)

export const createItem = (data: FormData) =>
  api.post<Item>('/items', data, { headers: { 'Content-Type': 'multipart/form-data' } })

export const updateItem = (id: number, data: FormData) =>
  api.put<Item>(`/items/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } })

export const deleteItem = (id: number) =>
  api.delete(`/items/${id}`)

// Tags
export const getTags = () =>
  api.get<Tag[]>('/tags')

// Image Analysis
export const analyzeImageText = (image: File) => {
  const data = new FormData()
  data.append('image', image)
  return api.post<{ text: string }>('/analyze/image-text', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
