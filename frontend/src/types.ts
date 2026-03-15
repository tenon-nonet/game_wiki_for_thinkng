export interface AuthResponse {
  token: string
  username: string
  role: string
}

export interface Game {
  id: number
  name: string
  description: string
  imagePath: string | null
  platforms: string | null
  releaseDates: string | null
  awards: string | null
  staff: string | null
  categories: string[] | null
  visible: boolean
  createdAt: string
  updatedAt: string
}

export interface Tag {
  id: number
  name: string
  gameId: number
  type?: string
  attribute?: string | null
}

export interface TagAttribute {
  id: number
  name: string
  gameId: number
}

export interface Comment {
  id: number
  content: string
  username: string
  createdAt: string
  likeCount: number
  likedByMe: boolean
  replies: Comment[]
}

export interface EditHistory {
  id: number
  entityType: 'ITEM' | 'BOSS' | 'NPC'
  entityId: number
  entityName: string
  actionType: 'CREATE' | 'UPDATE'
  gameName: string
  createdAt: string
}

export interface MyComment {
  id: number
  itemId: number
  itemName: string
  content: string
  createdAt: string
}

export interface EditRequest {
  id: number
  entityType: 'ITEM' | 'BOSS' | 'NPC'
  entityId: number | null
  actionType: 'CREATE' | 'UPDATE'
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  requestedBy: string
  reviewedBy: string | null
  entityName: string | null
  gameId: number | null
  gameName: string | null
  payload: Record<string, unknown> | null
  pendingImagePath: string | null
  reviewComment: string | null
  reviewedAt: string | null
  createdAt: string
}

export interface BoardGameSummary {
  gameId: number
  gameName: string
  imagePath: string | null
  threadCount: number
  latestPostedAt: string | null
}

export interface BoardThreadSummary {
  id: number
  gameId: number | null
  gameName: string
  title: string
  content: string
  username: string
  pinned: boolean
  locked: boolean
  replyCount: number
  lastPostedAt: string
  createdAt: string
  updatedAt: string
}

export interface BoardPost {
  id: number
  content: string
  username: string
  createdAt: string
  updatedAt: string
}

export interface BoardThreadDetail {
  thread: BoardThreadSummary
  posts: BoardPost[]
}

export interface Item {
  id: number
  name: string
  description: string
  imagePath: string | null
  gameId: number
  gameName: string
  tags: Tag[]
  category: string | null
  createdAt: string
  updatedAt: string
  updatedBy: string | null
}

export interface Boss {
  id: number
  name: string
  description: string
  imagePath: string | null
  gameId: number
  gameName: string
  tags: Tag[]
  dialogues: string[]
  createdAt: string
  updatedAt: string
  updatedBy: string | null
}

export interface CatalogEntry {
  id: number
  name: string
  type: string
  category: string | null
  gameId: number
  gameName: string
  createdAt: string
}

export interface Npc {
  id: number
  name: string
  description: string
  imagePath: string | null
  gameId: number
  gameName: string
  tags: Tag[]
  dialogues: string[]
  createdAt: string
  updatedAt: string
  updatedBy: string | null
}
