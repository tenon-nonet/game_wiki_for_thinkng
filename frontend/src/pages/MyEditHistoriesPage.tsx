import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { getMyEditHistories } from '../api'
import { isLoggedIn } from '../auth'
import { usePageMeta } from '../seo'
import type { EditHistory } from '../types'

const detailPathByType: Record<EditHistory['entityType'], string> = {
  ITEM: 'items',
  BOSS: 'bosses',
  NPC: 'npcs',
}

const labelByType: Record<EditHistory['entityType'], string> = {
  ITEM: 'アイテム',
  BOSS: 'ボス',
  NPC: 'NPC',
}

const labelByAction: Record<EditHistory['actionType'], string> = {
  CREATE: '追加',
  UPDATE: '更新',
}

export default function MyEditHistoriesPage() {
  usePageMeta({
    title: '編集記録一覧 | FROMDEX.com',
    description: 'ログインユーザーの編集記録一覧ページです。',
  })

  const [histories, setHistories] = useState<EditHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getMyEditHistories()
      .then((res) => setHistories(res.data))
      .catch(() => setError('編集記録の取得に失敗しました'))
      .finally(() => setLoading(false))
  }, [])

  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8 sm:py-10">
      <div className="mb-6 space-y-2">
        <Link to="/mypage" className="text-sm text-gray-400 hover:text-gray-200">← マイページ</Link>
        <h1 className="text-2xl font-bold text-gray-100 sm:text-3xl">編集記録一覧</h1>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg">
        {loading ? (
          <p className="text-gray-400">読み込み中...</p>
        ) : error ? (
          <p className="text-sm text-gray-200">{error}</p>
        ) : histories.length === 0 ? (
          <p className="text-sm text-gray-400">まだ編集記録はありません</p>
        ) : (
          <div className="space-y-3">
            {histories.map((history) => (
              <Link
                key={history.id}
                to={`/${detailPathByType[history.entityType]}/${history.entityId}`}
                className="flex flex-col gap-2 rounded-xl border border-zinc-800 bg-black/30 px-4 py-4 transition hover:border-amber-400/40 hover:bg-black/40 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span>{labelByType[history.entityType]}</span>
                    <span>•</span>
                    <span>{labelByAction[history.actionType]}</span>
                    <span>•</span>
                    <span>{history.gameName}</span>
                  </div>
                  <p className="truncate text-base font-medium text-gray-100">{history.entityName}</p>
                </div>
                <div className="shrink-0 text-xs text-gray-500">
                  {new Date(history.createdAt).toLocaleString('ja-JP')}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
