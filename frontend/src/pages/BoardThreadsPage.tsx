import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { createBoardThread, createGeneralBoardThread, getBoardThreads, getGame, getGeneralBoardThreads } from '../api'
import { getUsername, isLoggedIn } from '../auth'
import { excerpt, usePageMeta } from '../seo'
import type { BoardThreadSummary, Game } from '../types'

export default function BoardThreadsPage() {
  const location = useLocation()
  const { gameId } = useParams<{ gameId: string }>()
  const isGeneral = location.pathname === '/boards/general'
  const numericGameId = Number(gameId)
  const [game, setGame] = useState<Game | null>(null)
  const [threads, setThreads] = useState<BoardThreadSummary[]>([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [error, setError] = useState('')

  usePageMeta({
    title: `${isGeneral ? '総合掲示板' : game?.name ?? '掲示板'} | FROMDEX.com`,
    description: isGeneral
      ? '作品横断の雑談、考察、質問、情報交換のための総合掲示板です。'
      : game
        ? `${game.name} の掲示板。雑談、考察、質問、情報交換のスレッド一覧です。`
        : '掲示板スレッド一覧',
  })

  const load = () => {
    if (isGeneral) {
      setGame(null)
      getGeneralBoardThreads().then((res) => setThreads(res.data))
      return
    }
    getGame(numericGameId).then((res) => setGame(res.data))
    getBoardThreads(numericGameId).then((res) => setThreads(res.data))
  }

  useEffect(() => {
    load()
  }, [numericGameId])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      if (isGeneral) {
        await createGeneralBoardThread(title, content)
      } else {
        await createBoardThread(numericGameId, title, content)
      }
      setTitle('')
      setContent('')
      load()
    } catch (err: any) {
      setError(err.response?.data?.error || 'スレッド作成に失敗しました')
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Link to="/boards" className="text-sm text-gray-300 hover:underline">← 掲示板一覧</Link>
        {!isGeneral && <Link to={`/games/${numericGameId}`} className="text-sm text-gray-500 hover:underline">← ゲーム詳細</Link>}
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-100">{isGeneral ? '総合掲示板' : game?.name ?? '掲示板'}</h1>
        <p className="mt-2 text-sm text-gray-400">
          ログイン不要でスレッド作成と返信ができます。現在の投稿名: {isLoggedIn() ? getUsername() : '名もなき褪せ人'}
        </p>
      </div>

      <form onSubmit={handleCreate} className="mb-8 space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/85 p-5 shadow-lg">
        <h2 className="text-lg font-semibold text-gray-100">新しいスレッドを作成</h2>
        {error && <p className="text-sm text-red-300">{error}</p>}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="スレッドタイトル"
          required
          maxLength={200}
          className="w-full rounded border border-gray-600 bg-zinc-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-800"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="本文"
          required
          rows={6}
          className="w-full rounded border border-gray-600 bg-zinc-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-800"
        />
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-md border border-amber-400/70 bg-gradient-to-b from-amber-300/30 via-amber-500/20 to-transparent px-5 py-2 text-sm font-semibold tracking-[0.08em] text-amber-50 shadow-[0_0_22px_rgba(245,158,11,0.16)] transition hover:border-amber-300/90 hover:bg-amber-300/24 hover:text-white"
        >
          スレッドを作成
        </button>
      </form>

      <div className="space-y-3">
        {threads.length === 0 ? (
          <p className="text-sm text-gray-500">まだスレッドはありません</p>
        ) : (
          threads.map((thread) => (
            <Link
              key={thread.id}
              to={thread.gameId ? `/boards/${thread.gameId}/${thread.id}` : `/boards/general/${thread.id}`}
              className="block rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 transition hover:border-zinc-600 hover:bg-zinc-900"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-100">{thread.title}</h2>
                  <p className="mt-2 text-sm text-gray-400">{excerpt(thread.content, 120) || thread.content}</p>
                </div>
                <div className="shrink-0 text-right text-xs text-gray-500">
                  <p>{thread.username}</p>
                  <p>{new Date(thread.lastPostedAt).toLocaleString('ja-JP')}</p>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-500">
                返信 {thread.replyCount} 件
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
