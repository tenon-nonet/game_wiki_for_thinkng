type Props = {
  registered: number
  total: number
}

export default function CatalogProgressBar({ registered, total }: Props) {
  const percentage = total === 0 ? 0 : Math.round((registered / total) * 100)

  return (
    <div className="mb-5 w-full">
      <div className="mb-1 flex justify-between text-xs text-gray-500">
        <span>図録登録済み {registered} / {total}</span>
        <span>{percentage}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-zinc-800">
        <div className="h-1.5 rounded-full bg-red-800 transition-all" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  )
}
