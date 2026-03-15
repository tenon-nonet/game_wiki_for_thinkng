import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { createBoardPost, createGeneralBoardPost, getBoardThread, getGeneralBoardThread } from '../api'
import { getUsername, isLoggedIn } from '../auth'
import { excerpt, usePageMeta } from '../seo'
import type { BoardThreadDetail } from '../types'

export default function BoardThreadDetailPage() {
  const location = useLocation()
  const { gameId, threadId } = useParams<{ gameId: string; threadId: string }>()
  const isGeneral = location.pathname.startsWith('/boards/general/')
  const numericGameId = Number(gameId)
  const numericThreadId = Number(threadId)
  const [detail, setDetail] = useState<BoardThreadDetail | null>(null)
  const [content, setContent] = useState('')
  const [error, setError] = useState('')

  usePageMeta({
    title: `${detail?.thread.title ?? 'スレッド詳細'} | FROMDEX.com`,
    description: excerpt(detail?.thread.content, 120) || '掲示板スレッド詳細ページ',
  })

  const load = () => {
    if (isGeneral) {
      getGeneralBoardThread(numericThreadId).then((res) => setDetail(res.data))
      return
    }
    getBoardThread(numericGameId, numericThreadId).then((res) => setDetail(res.data))
  }

  useEffect(() => {
    load()
  }, [numericGameId, numericThreadId])

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      if (isGeneral) {
        await createGeneralBoardPost(numericThreadId, content)
      } else {
        await createBoardPost(numericGameId, numericThreadId, content)
      }
      setContent('')
      load()
    } catch (err: any) {
      setError(err.response?.data?.error || '返信に失敗しました')
    }
  }

  if (!detail) {
    return <div className="py-12 text-center text-sm text-gray-500">読み込み中...</div>
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Link to={isGeneral ? '/boards/general' : `/boards/${numericGameId}`} className="text-sm text-gray-300 hover:underline">← スレッド一覧</Link>
        <Link to="/boards" className="text-sm text-gray-500 hover:underline">← 掲示板一覧</Link>
      </div>

      <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900/90 p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-gray-100">{detail.thread.title}</h1>
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
          <span>{detail.thread.gameName}</span>
          <span>{detail.thread.username}</span>
          <span>{new Date(detail.thread.createdAt).toLocaleString('ja-JP')}</span>
        </div>
        <div className="mt-5 whitespace-pre-wrap text-sm leading-7 text-gray-300">
          {detail.thread.content}
        </div>
      </div>

      <form onSubmit={handleReply} className="mb-8 space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/85 p-5 shadow-lg">
        <h2 className="text-lg font-semibold text-gray-100">返信する</h2>
        <p className="text-sm text-gray-400">現在の投稿名: {isLoggedIn() ? getUsername() : '名もなき褪せ人'}</p>
        {error && <p className="text-sm text-red-300">{error}</p>}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="返信内容"
          required
          maxLength={100}
          rows={5}
          className="w-full rounded border border-gray-600 bg-zinc-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-800"
        />
        <p className="text-xs text-gray-500">{content.length}/100</p>
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-md border border-amber-400/70 bg-gradient-to-b from-amber-300/30 via-amber-500/20 to-transparent px-5 py-2 text-sm font-semibold tracking-[0.08em] text-amber-50 shadow-[0_0_22px_rgba(245,158,11,0.16)] transition hover:border-amber-300/90 hover:bg-amber-300/24 hover:text-white"
        >
          返信する
        </button>
      </form>

      <div className="space-y-3">
        {detail.posts.length === 0 ? (
          <p className="text-sm text-gray-500">返信はまだありません</p>
        ) : (
          detail.posts.map((post) => (
            <div key={post.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
              <div className="mb-3 flex flex-wrap gap-3 text-xs text-gray-500">
                <span>{post.username}</span>
                <span>{new Date(post.createdAt).toLocaleString('ja-JP')}</span>
              </div>
              <div className="whitespace-pre-wrap text-sm leading-7 text-gray-300">{post.content}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
