export const MAX_IMAGE_FILE_SIZE = 1024 * 1024
export const MAX_GAME_IMAGE_FILE_SIZE = 5 * 1024 * 1024
export const IMAGE_FILE_SIZE_ERROR = '画像は1MB以下に圧縮して下さい'
export const GAME_IMAGE_FILE_SIZE_ERROR = 'ゲーム画像は5MB以下に圧縮してください'

export const isImageFileSizeValid = (file: File | null) =>
  !file || file.size <= MAX_IMAGE_FILE_SIZE

export const isGameImageFileSizeValid = (file: File | null) =>
  !file || file.size <= MAX_GAME_IMAGE_FILE_SIZE
