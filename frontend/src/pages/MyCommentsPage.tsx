import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { getMyComments } from '../api'
import { isLoggedIn } from '../auth'
import { usePageMeta } from '../seo'
import type { MyComment } from '../types'

export default function MyCommentsPage() {
  usePageMeta({
    title: 'メッセージ投稿履歴 | FROMDEX.com',
    description: 'ログインユーザーのメッセージ投稿履歴一覧ページです。',
  })

  const [comments, setComments] = useState<MyComment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getMyComments()
      .then((res) => setComments(res.data))
      .catch(() => setError('メッセージ投稿記録の取得に失敗しました'))
      .finally(() => setLoading(false))
  }, [])

  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8 sm:py-10">
      <div className="mb-6 space-y-2">
        <Link to="/mypage" className="text-sm text-gray-400 hover:text-gray-200">← マイページ</Link>
        <h1 className="text-2xl font-bold text-gray-100 sm:text-3xl">メッセージ投稿記録一覧</h1>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg">
        {loading ? (
          <p className="text-gray-400">読み込み中...</p>
        ) : error ? (
          <p className="text-sm text-gray-200">{error}</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-gray-400">まだメッセージ投稿記録はありません</p>
        ) : (
          <div className="space-y-3">
            {comments.map((comment) => (
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
          </div>
        )}
      </div>
    </div>
  )
}
