import { Link } from 'react-router-dom'

type Props = {
  to: string
  name: string
  gameName: string
  imagePath: string | null
  description?: string | null
  createdAt: string
  updatedAt: string
  imageHeightClass?: string
  bodyMinHeightClass?: string
  draggable?: boolean
  onDragStart?: () => void
  onDragOver?: (event: React.DragEvent<HTMLDivElement>) => void
  onDrop?: () => void
  onDragEnd?: () => void
  isDragTarget?: boolean
}

export default function EncyclopediaCard({
  to,
  name,
  gameName,
  imagePath,
  description,
  createdAt,
  updatedAt,
  imageHeightClass = 'h-[clamp(18rem,30vw,25rem)]',
  bodyMinHeightClass = 'min-h-[clamp(14rem,18vw,20rem)] sm:min-h-[clamp(15rem,20vw,22rem)]',
  draggable = false,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragTarget = false,
}: Props) {
  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`group h-full overflow-hidden rounded-lg border border-zinc-800 bg-zinc-800 shadow-[0_20px_50px_rgba(0,0,0,0.28)] transition duration-300 hover:-translate-y-1 hover:border-red-900/60 hover:shadow-[0_28px_64px_rgba(0,0,0,0.38)] ${draggable ? 'cursor-grab active:cursor-grabbing' : ''} ${isDragTarget ? 'ring-2 ring-red-700/80 opacity-80' : ''}`}
    >
      <Link to={to} className="flex h-full flex-col">
        <div className="relative overflow-hidden bg-zinc-900">
          {imagePath ? (
            <img
              src={`/uploads/${imagePath}`}
              alt={name}
              className={`${imageHeightClass} w-full object-contain bg-zinc-900 transition duration-500 group-hover:scale-[1.01]`}
            />
          ) : (
            <div className={`flex ${imageHeightClass} w-full items-center justify-center text-sm text-gray-500`}>
              画像なし
            </div>
          )}
        </div>

        <div className={`flex flex-1 flex-col ${bodyMinHeightClass} p-5 sm:p-6`}>
          <p className="text-sm text-gray-100">{gameName}</p>
          <div className="mb-3 mt-2 flex flex-wrap items-start justify-between gap-2">
            <h2 className="text-xl font-bold leading-tight text-gray-100 sm:text-2xl">{name}</h2>
          </div>

          {description ? (
            <p className="mt-4 line-clamp-6 whitespace-pre-wrap break-words text-gray-300 sm:line-clamp-7">{description}</p>
          ) : (
            <p className="mt-4 text-sm text-zinc-500">説明未登録</p>
          )}

          <div className="mt-auto space-y-1 pt-5 text-xs text-gray-500">
            <p>追加日: {new Date(createdAt).toLocaleDateString('ja-JP')}</p>
            <p>更新日: {new Date(updatedAt).toLocaleDateString('ja-JP')}</p>
          </div>
        </div>
      </Link>
    </div>
  )
}
