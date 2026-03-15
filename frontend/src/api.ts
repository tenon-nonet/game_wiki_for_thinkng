import axios from 'axios'
import type { AuthResponse, Game, Item, Boss, Npc, Tag, TagAttribute, Comment, CatalogEntry, EditHistory, MyComment, EditRequest, Report, Ban, BoardGameSummary, BoardThreadSummary, BoardThreadDetail, BoardPost } from './types'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auth
export const register = (username: string, password: string) =>
  api.post<AuthResponse>('/auth/register', { username, password })

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
  categories?: string[]
  visible?: boolean
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

export const updateGameCategories = (id: number, categories: string[]) =>
  api.put<Game>(`/games/${id}/categories`, { categories })

// Items
export const getItems = (gameId?: number, tag?: string, keyword?: string) =>
  api.get<Item[]>('/items', { params: { ...(gameId ? { gameId } : {}), ...(tag ? { tag } : {}), ...(keyword ? { keyword } : {}) } })

export const getItem = (id: number) =>
  api.get<Item>(`/items/${id}`)

export const createItem = (data: FormData) =>
  api.post<Item | { pendingApproval: boolean; message: string }>('/items', data, { headers: { 'Content-Type': 'multipart/form-data' } })

export const updateItem = (id: number, data: FormData) =>
  api.put<Item | { pendingApproval: boolean; message: string }>(`/items/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } })

export const deleteItem = (id: number) =>
  api.delete(`/items/${id}`)

export const updateItemOrder = (ids: number[]) =>
  api.put('/items/order', ids)

// Bosses
export const getBosses = (gameId?: number, tag?: string, keyword?: string) =>
  api.get<Boss[]>('/bosses', { params: { ...(gameId ? { gameId } : {}), ...(tag ? { tag } : {}), ...(keyword ? { keyword } : {}) } })

export const getBoss = (id: number) =>
  api.get<Boss>(`/bosses/${id}`)

export const createBoss = (data: FormData) =>
  api.post<Boss | { pendingApproval: boolean; message: string }>('/bosses', data, { headers: { 'Content-Type': 'multipart/form-data' } })

export const updateBoss = (id: number, data: FormData) =>
  api.put<Boss | { pendingApproval: boolean; message: string }>(`/bosses/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } })

export const deleteBoss = (id: number) =>
  api.delete(`/bosses/${id}`)

export const updateBossOrder = (ids: number[]) =>
  api.put('/bosses/order', ids)

// NPCs
export const getNpcs = (gameId?: number, tag?: string, keyword?: string) =>
  api.get<Npc[]>('/npcs', { params: { ...(gameId ? { gameId } : {}), ...(tag ? { tag } : {}), ...(keyword ? { keyword } : {}) } })

export const getNpc = (id: number) =>
  api.get<Npc>(`/npcs/${id}`)

export const createNpc = (data: FormData) =>
  api.post<Npc | { pendingApproval: boolean; message: string }>('/npcs', data, { headers: { 'Content-Type': 'multipart/form-data' } })

export const updateNpc = (id: number, data: FormData) =>
  api.put<Npc | { pendingApproval: boolean; message: string }>(`/npcs/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } })

export const deleteNpc = (id: number) =>
  api.delete(`/npcs/${id}`)

export const updateNpcOrder = (ids: number[]) =>
  api.put('/npcs/order', ids)

// Tags
export const getTags = (gameId: number, type?: string) =>
  api.get<Tag[]>('/tags', { params: { gameId, ...(type ? { type } : {}) } })

export const createTag = (name: string, gameId: number, type?: string, attribute?: string) =>
  api.post<Tag>('/tags', { name, gameId, ...(type ? { type } : {}), ...(attribute ? { attribute } : {}) })

export const updateTag = (id: number, name: string, attribute?: string) =>
  api.put<Tag>(`/tags/${id}`, { name, ...(attribute !== undefined ? { attribute } : {}) })

export const deleteTag = (id: number) =>
  api.delete(`/tags/${id}`)

// Tag Attributes
export const getTagAttributes = (gameId: number) =>
  api.get<TagAttribute[]>('/tag-attributes', { params: { gameId } })

export const createTagAttribute = (name: string, gameId: number) =>
  api.post<TagAttribute>('/tag-attributes', { name, gameId })

export const deleteTagAttribute = (id: number) =>
  api.delete(`/tag-attributes/${id}`)

export const updateTagAttributeOrder = (ids: number[]) =>
  api.put('/tag-attributes/order', ids)

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

// Catalog
export const getCatalogEntries = (gameId?: number, type?: string) =>
  api.get<CatalogEntry[]>('/catalog', { params: { ...(gameId ? { gameId } : {}), ...(type ? { type } : {}) } })

export const createCatalogEntry = (data: { name: string; type: string; gameId: number; category?: string }) =>
  api.post<CatalogEntry>('/catalog', data)

export const deleteCatalogEntry = (id: number, type: string) =>
  api.delete(`/catalog/${id}`, { params: { type } })

export const bulkCreateCatalogEntries = (data: { names: string[]; type: string; gameId: number; category?: string }) =>
  api.post<{ added: number; skipped: number }>('/catalog/bulk', data)

// Image Analysis
export const analyzeImageText = (image: File) => {
  const data = new FormData()
  data.append('image', image)
  return api.post<{ text: string }>('/analyze/image-text', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

// Visitors
export const trackHomeVisit = () =>
  api.post<{ todayUniqueVisitors: number; totalUniqueDailyVisitors: number }>('/visitors/home')

// My Page
export const getMyEditHistories = () =>
  api.get<EditHistory[]>('/mypage/edit-histories')

export const getMyComments = () =>
  api.get<MyComment[]>('/mypage/comments')

export const getEditRequests = () =>
  api.get<EditRequest[]>('/edit-requests')

export const approveEditRequest = (id: number) =>
  api.post<EditRequest>(`/edit-requests/${id}/approve`)

export const rejectEditRequest = (id: number, reviewComment?: string) =>
  api.post<EditRequest>(`/edit-requests/${id}/reject`, reviewComment ? { reviewComment } : {})

// Boards
export const getBoardGames = () =>
  api.get<BoardGameSummary[]>('/boards')

export const getBoardThreads = (gameId: number) =>
  api.get<BoardThreadSummary[]>(`/boards/${gameId}/threads`)

export const createBoardThread = (gameId: number, title: string, content: string, pinned = false) =>
  api.post<BoardThreadSummary>(`/boards/${gameId}/threads`, { title, content, pinned })

export const getBoardThread = (gameId: number, threadId: number) =>
  api.get<BoardThreadDetail>(`/boards/${gameId}/threads/${threadId}`)

export const createBoardPost = (gameId: number, threadId: number, content: string) =>
  api.post<BoardPost>(`/boards/${gameId}/threads/${threadId}/posts`, { content })

export const getGeneralBoardThreads = () =>
  api.get<BoardThreadSummary[]>('/boards/general/threads')

export const createGeneralBoardThread = (title: string, content: string, pinned = false) =>
  api.post<BoardThreadSummary>('/boards/general/threads', { title, content, pinned })

export const getGeneralBoardThread = (threadId: number) =>
  api.get<BoardThreadDetail>(`/boards/general/threads/${threadId}`)

export const createGeneralBoardPost = (threadId: number, content: string) =>
  api.post<BoardPost>(`/boards/general/threads/${threadId}/posts`, { content })

export const deleteBoardThread = (gameId: number, threadId: number) =>
  api.delete(`/boards/${gameId}/threads/${threadId}`)

export const deleteGeneralBoardThread = (threadId: number) =>
  api.delete(`/boards/general/threads/${threadId}`)

export const deleteBoardPost = (gameId: number, threadId: number, postId: number) =>
  api.delete(`/boards/${gameId}/threads/${threadId}/posts/${postId}`)

export const deleteGeneralBoardPost = (threadId: number, postId: number) =>
  api.delete(`/boards/general/threads/${threadId}/posts/${postId}`)

// Reports
export const createBoardThreadReport = (threadId: number, reason: string) =>
  api.post<Report>(`/reports/board-threads/${threadId}`, { reason })

export const createBoardPostReport = (postId: number, reason: string) =>
  api.post<Report>(`/reports/board-posts/${postId}`, { reason })

export const getReports = () =>
  api.get<Report[]>('/reports')

export const updateReportStatus = (id: number, status: Report['status']) =>
  api.put<Report>(`/reports/${id}/status`, { status })

export const banReportedAuthor = (id: number) =>
  api.post<Report>(`/reports/${id}/ban`)

export const getBans = () =>
  api.get<Ban[]>('/reports/bans')

export const removeBan = (id: number) =>
  api.delete(`/reports/bans/${id}`)
