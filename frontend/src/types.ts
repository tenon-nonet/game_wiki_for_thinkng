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
  createdAt: string
  updatedAt: string
}

export interface Tag {
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

export interface Item {
  id: number
  name: string
  description: string
  imagePath: string | null
  gameId: number
  gameName: string
  tags: Tag[]
  createdAt: string
  updatedAt: string
}
