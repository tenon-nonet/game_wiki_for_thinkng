import type { CatalogEntry } from '../../types'
import type { EntryStatus, TabType } from '../../pages/catalogUtils'

type Props = {
  entry: CatalogEntry
  tab: TabType
  status: EntryStatus
  imagePath?: string | null
  onOpen: () => void
  onDelete?: () => void
}

export default function CatalogEntryCard({ entry, status, imagePath, onOpen, onDelete }: Props) {
  return (
    <div
      className="relative flex cursor-pointer flex-col gap-1 overflow-hidden rounded border border-zinc-700 bg-zinc-900 transition hover:border-red-800"
      onClick={onOpen}
    >
      {imagePath ? (
        <img
          src={`/uploads/${imagePath}`}
          alt={entry.name}
          className="h-16 w-full object-cover object-top"
        />
      ) : (
        <div className="flex h-16 w-full items-center justify-center bg-zinc-800 text-xs text-zinc-600">
          画像なし
        </div>
      )}
      <div className="flex flex-col gap-1 px-2.5 py-2">
        <span className="break-all text-xs leading-tight text-gray-100">{entry.name}</span>
        <div className="flex items-center gap-2">
          {status === 'REGISTERED' ? (
            <span className="text-xs text-green-400">図録登録</span>
          ) : status === 'IN_PROGRESS' ? (
            <span className="text-xs text-amber-400">情報不足</span>
          ) : (
            <span className="text-xs text-zinc-500">情報なし</span>
          )}
          {onDelete && (
            <button
              onClick={(event) => {
                event.stopPropagation()
                onDelete()
              }}
              className="ml-auto rounded border border-red-500/40 px-1.5 py-0.5 text-xs text-red-400/90 transition hover:border-red-400/70 hover:text-red-300"
              title="削除"
            >
              削除
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
