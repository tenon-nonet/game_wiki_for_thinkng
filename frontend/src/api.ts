import axios from 'axios'
import type { AuthResponse, Game, Item, Tag, Comment } from './types'

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

export interface GameFormData {
  name: string
  description: string
  platforms?: string
  releaseDates?: string
  awards?: string
  staff?: string
}

export const createGame = (form: GameFormData, image?: File | null) => {
  const data = new FormData()
  data.append('data', new Blob([JSON.stringify(form)], { type: 'application/json' }))
  if (image) data.append('image', image)
  return api.post<Game>('/games', data, { headers: { 'Content-Type': 'multipart/form-data' } })
}

export const updateGame = (id: number, form: GameFormData, image?: File | null) => {
  const data = new FormData()
  data.append('data', new Blob([JSON.stringify(form)], { type: 'application/json' }))
  if (image) data.append('image', image)
  return api.put<Game>(`/games/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } })
}

export const deleteGame = (id: number) =>
  api.delete(`/games/${id}`)

export const updateGameOrder = (ids: number[]) =>
  api.put('/games/order', ids)

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

export const updateItemOrder = (ids: number[]) =>
  api.put('/items/order', ids)

// Tags
export const getTags = (gameId: number) =>
  api.get<Tag[]>('/tags', { params: { gameId } })

export const createTag = (name: string, gameId: number) =>
  api.post<Tag>('/tags', { name, gameId })

export const updateTag = (id: number, name: string) =>
  api.put<Tag>(`/tags/${id}`, { name })

export const deleteTag = (id: number) =>
  api.delete(`/tags/${id}`)

// Comments
export const getComments = (itemId: number) =>
  api.get<Comment[]>(`/items/${itemId}/comments`)

export const createComment = (itemId: number, content: string, parentId?: number) =>
  api.post<Comment>(`/items/${itemId}/comments`, { content, ...(parentId ? { parentId: String(parentId) } : {}) })

export const updateComment = (id: number, content: string) =>
  api.put<Comment>(`/comments/${id}`, { content })

export const deleteComment = (id: number) =>
  api.delete(`/comments/${id}`)

export const toggleCommentLike = (id: number) =>
  api.post<Comment>(`/comments/${id}/like`)

// News
export const getNews = (q: string, limit?: number) =>
  api.get<{ title: string; url: string; publishedAt: string; source: string }[]>('/news', { params: { q, ...(limit ? { limit } : {}) } })

// Image Analysis
export const analyzeImageText = (image: File) => {
  const data = new FormData()
  data.append('image', image)
  return api.post<{ text: string }>('/analyze/image-text', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
