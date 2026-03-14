import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { getMyComments, getMyEditHistories } from '../api'
import { getUsername, isLoggedIn } from '../auth'
import { usePageMeta } from '../seo'
import type { EditHistory, MyComment } from '../types'

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

export default function MyPage() {
  usePageMeta({
    title: 'マイページ | FROMDEX.com',
    description: '自分の編集記録とメッセージ投稿履歴を確認できるマイページです。',
  })

  const [histories, setHistories] = useState<EditHistory[]>([])
  const [comments, setComments] = useState<MyComment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const username = getUsername()
  const previewHistories = histories.slice(0, 10)
  const previewComments = comments.slice(0, 10)

  useEffect(() => {
    Promise.all([getMyEditHistories(), getMyComments()])
      .then(([historyRes, commentRes]) => {
        setHistories(historyRes.data)
        setComments(commentRes.data)
      })
      .catch(() => setError('マイページ情報の取得に失敗しました'))
      .finally(() => setLoading(false))
  }, [])

  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8 sm:py-10">
      <div className="mb-6 space-y-2">
        <p className="text-sm text-gray-400">マイページ</p>
        <h1 className="text-2xl font-bold text-gray-100 sm:text-3xl">{username}</h1>
        <p className="text-sm text-gray-500">編集記録とメッセージ投稿記録を確認する</p>
      </div>

      {error && <p className="mb-4 text-sm text-gray-200">{error}</p>}

      <div className="space-y-8">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-100">編集記録</h2>
            <p className="text-sm text-gray-500">追加・更新した図録データ</p>
          </div>

          {loading ? (
            <p className="text-gray-400">読み込み中...</p>
          ) : histories.length === 0 ? (
            <p className="text-sm text-gray-400">まだ編集履歴はありません</p>
          ) : (
            <div className="space-y-3">
              {previewHistories.map((history) => (
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
              {histories.length > 10 && (
                <div className="pt-2">
                  <Link to="/mypage/edit-histories" className="text-sm text-amber-200 hover:text-amber-100">
                    すべての編集記録を見る →
                  </Link>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-100">メッセージ投稿記録</h2>
            <p className="text-sm text-gray-500">アイテム詳細に投稿したメッセージ</p>
          </div>

          {loading ? (
            <p className="text-gray-400">読み込み中...</p>
          ) : comments.length === 0 ? (
            <p className="text-sm text-gray-400">まだメッセージ投稿履歴はありません</p>
          ) : (
            <div className="space-y-3">
              {previewComments.map((comment) => (
                <Link
                  key={comment.id}
                  to={`/items/${comment.itemId}`}
                  className="block rounded-xl border border-zinc-800 bg-black/30 px-4 py-4 transition hover:border-amber-400/40 hover:bg-black/40"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      <p className="text-xs text-gray-500">{comment.itemName}</p>
                      <p className="line-clamp-2 text-sm text-gray-100">{comment.content}</p>
                    </div>
                    <div className="shrink-0 text-xs text-gray-500">
                      {new Date(comment.createdAt).toLocaleString('ja-JP')}
                    </div>
                  </div>
                </Link>
              ))}
              {comments.length > 10 && (
                <div className="pt-2">
                  <Link to="/mypage/comments" className="text-sm text-amber-200 hover:text-amber-100">
                    すべてのメッセージ投稿記録を見る →
                  </Link>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
