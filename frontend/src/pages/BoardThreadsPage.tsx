import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import {
  createBoardThread,
  createBoardThreadReport,
  createGeneralBoardThread,
  deleteBoardThread,
  deleteGeneralBoardThread,
  getBoardThreads,
  getGame,
  getGeneralBoardThreads,
} from '../api'
import { isAdmin } from '../auth'
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
  const [pinned, setPinned] = useState(false)
  const [error, setError] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)

  usePageMeta({
    title: `${isGeneral ? '総合掲示板' : game?.name ?? '掲示板'} | FROMDEX.com`,
    description: isGeneral
      ? '総合雑談、考察、質問、情報共有のための掲示板です。'
      : game
        ? `${game.name} の雑談、考察、質問、情報共有のための掲示板です。`
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
  }, [isGeneral, numericGameId])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      if (isGeneral) {
        await createGeneralBoardThread(title, content, pinned)
      } else {
        await createBoardThread(numericGameId, title, content, pinned)
      }
      setTitle('')
      setContent('')
      setPinned(false)
      setShowCreateForm(false)
      load()
    } catch (err: any) {
      setError(err.response?.data?.error || 'スレッド作成に失敗しました')
    }
  }

  const handleReport = async (threadId: number) => {
    const reason = window.prompt('通報理由を入力してください')
    if (!reason || !reason.trim()) return
    try {
      await createBoardThreadReport(threadId, reason.trim())
      window.alert('通報を受け付けました')
    } catch (err: any) {
      window.alert(err.response?.data?.error || '通報に失敗しました')
    }
  }

  const handleDeleteThread = async (threadId: number) => {
    if (!window.confirm('このスレッドを削除します。よろしいですか？')) return
    try {
      if (isGeneral) {
        await deleteGeneralBoardThread(threadId)
      } else {
        await deleteBoardThread(numericGameId, threadId)
      }
      load()
    } catch (err: any) {
      window.alert(err.response?.data?.error || 'スレッド削除に失敗しました')
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Link to="/boards" className="text-sm text-gray-300 hover:underline">← 掲示板一覧</Link>
        {!isGeneral && (
          <Link to={`/games/${numericGameId}`} className="text-sm text-gray-500 hover:underline">← ゲーム詳細</Link>
        )}
      </div>

      <div className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-gray-100">{isGeneral ? '総合掲示板' : game?.name ?? '掲示板'}</h1>
          <button
            type="button"
            onClick={() => {
              setError('')
              setShowCreateForm((prev) => !prev)
            }}
            className="inline-flex items-center justify-center rounded-md border border-amber-400/70 bg-gradient-to-b from-amber-300/30 via-amber-500/20 to-transparent px-5 py-2 text-sm font-semibold tracking-[0.08em] text-amber-50 shadow-[0_0_22px_rgba(245,158,11,0.16)] transition hover:border-amber-300/90 hover:bg-amber-300/24 hover:text-white"
          >
            {showCreateForm ? '作成フォームを閉じる' : 'スレッド作成する'}
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-400">
          好きなこと書いて好きなこと話したらいいのだ。管理人への連絡もコチラから
        </p>
      </div>

      {showCreateForm && (
        <div className="mb-8 rounded-2xl border border-zinc-800 bg-zinc-900/85 p-5 shadow-lg">
          <form onSubmit={handleCreate} className="space-y-3">
            {error && <p className="text-sm text-red-300">{error}</p>}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">スレッドタイトル</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="スレッドタイトルを書いてね"
                required
                maxLength={200}
                className="w-full rounded border border-gray-600 bg-zinc-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-800"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">1コメ</label>
              <p className="mb-2 text-xs text-gray-500">300文字まで入力できます</p>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="1コメを書いてね"
                required
                maxLength={300}
                rows={6}
                className="w-full rounded border border-gray-600 bg-zinc-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-800"
              />
            </div>
            {isAdmin() && (
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={pinned}
                  onChange={(e) => setPinned(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-600 bg-zinc-800 text-amber-500 focus:ring-red-800"
                />
                固定スレッドにする
              </label>
            )}
            <p className="text-xs text-gray-500">{content.length}/300</p>
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-md border border-amber-400/70 bg-gradient-to-b from-amber-300/30 via-amber-500/20 to-transparent px-5 py-2 text-sm font-semibold tracking-[0.08em] text-amber-50 shadow-[0_0_22px_rgba(245,158,11,0.16)] transition hover:border-amber-300/90 hover:bg-amber-300/24 hover:text-white"
              >
                作成する
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false)
                  setError('')
                }}
                className="rounded-md border border-zinc-700 bg-zinc-800 px-5 py-2 text-sm font-medium text-gray-200 transition hover:border-zinc-500 hover:bg-zinc-700"
              >
                キャンセル
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {threads.length === 0 ? (
          <p className="col-span-full text-sm text-gray-500">まだスレッドはありません</p>
        ) : (
          threads.map((thread) => (
            <div
              key={thread.id}
              className={`rounded-2xl p-5 transition hover:bg-zinc-900 ${
                thread.pinned
                  ? 'border border-amber-700/70 bg-amber-950/10 shadow-[0_0_24px_rgba(245,158,11,0.08)] hover:border-amber-600/80'
                  : 'border border-zinc-800 bg-zinc-900/80 hover:border-zinc-600'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <Link
                  to={thread.gameId ? `/boards/${thread.gameId}/${thread.id}` : `/boards/general/${thread.id}`}
                  className="min-w-0 flex-1"
                >
                  <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.14em] text-amber-200/80">スレッドタイトル</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {thread.pinned && (
                      <span className="rounded border border-amber-500/80 bg-amber-200/10 px-2 py-1 text-[11px] font-semibold tracking-[0.08em] text-amber-100">
                        固定スレッド
                      </span>
                    )}
                    <h2 className="text-lg font-semibold text-gray-100">{thread.title}</h2>
                  </div>
                  <p className="mt-2 text-sm text-gray-400">1コメ: {excerpt(thread.content, 120) || thread.content}</p>
                </Link>
                <div className="shrink-0 text-right text-xs text-gray-500">
                  <p>{thread.username}</p>
                  <p>{new Date(thread.lastPostedAt).toLocaleString('ja-JP')}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 text-xs text-gray-500">
                <span>コメント {thread.replyCount} 件</span>
                <div className="flex items-center gap-2">
                  {isAdmin() && (
                    <button
                      type="button"
                      onClick={() => handleDeleteThread(thread.id)}
                      className="rounded border border-red-900/70 px-2 py-1 text-red-200 transition hover:border-red-700 hover:bg-red-950/40"
                    >
                      削除
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleReport(thread.id)}
                    className="rounded border border-zinc-700 px-2 py-1 text-gray-300 transition hover:border-red-700 hover:text-red-300"
                  >
                    通報
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
