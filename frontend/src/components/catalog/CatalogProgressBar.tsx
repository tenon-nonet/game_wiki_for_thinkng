type Props = {
  registered: number
  total: number
}

export default function CatalogProgressBar({ registered, total }: Props) {
  const percentage = total === 0 ? 0 : Math.round((registered / total) * 100)

  return (
    <div className="mb-5 w-full border border-amber-400/20 bg-zinc-950/70 px-3 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
      <div className="mb-2 flex items-end justify-between gap-3">
        <div>
          <p className="mt-1 text-sm text-zinc-200">
            図録登録済み <span className="font-semibold text-amber-200">{registered}</span> / {total}
          </p>
        </div>
        <span className="text-lg font-semibold text-zinc-100">{percentage}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden bg-zinc-900/90">
        <div
          className="h-2 bg-amber-500 transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
