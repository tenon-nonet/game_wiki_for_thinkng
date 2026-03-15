import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import {
  createBoardPost,
  createBoardPostReport,
  createBoardThreadReport,
  createGeneralBoardPost,
  deleteBoardPost,
  deleteBoardThread,
  deleteGeneralBoardPost,
  deleteGeneralBoardThread,
  getBoardThread,
  getGeneralBoardThread,
} from '../api'
import { getUsername, isAdmin, isLoggedIn } from '../auth'
import MessageOverlay from '../components/MessageOverlay'
import { useNavigate } from 'react-router-dom'
import { excerpt, usePageMeta } from '../seo'
import type { BoardThreadDetail } from '../types'

export default function BoardThreadDetailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { gameId, threadId } = useParams<{ gameId: string; threadId: string }>()
  const isGeneral = location.pathname.startsWith('/boards/general/')
  const numericGameId = Number(gameId)
  const numericThreadId = Number(threadId)
  const [detail, setDetail] = useState<BoardThreadDetail | null>(null)
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const [lengthError, setLengthError] = useState('')
  const [showPostedOverlay, setShowPostedOverlay] = useState(false)

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
  }, [isGeneral, numericGameId, numericThreadId])

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
      setLengthError('')
      load()
      setShowPostedOverlay(true)
    } catch (err: any) {
      setError(err.response?.data?.error || '返信に失敗しました')
    }
  }

  const handleThreadReport = async () => {
    const reason = window.prompt('通報理由を入力してください')
    if (!reason || !reason.trim()) return
    try {
      await createBoardThreadReport(numericThreadId, reason.trim())
      window.alert('通報を受け付けました')
    } catch (err: any) {
      window.alert(err.response?.data?.error || '通報に失敗しました')
    }
  }

  const handlePostReport = async (postId: number) => {
    const reason = window.prompt('通報理由を入力してください')
    if (!reason || !reason.trim()) return
    try {
      await createBoardPostReport(postId, reason.trim())
      window.alert('通報を受け付けました')
    } catch (err: any) {
      window.alert(err.response?.data?.error || '通報に失敗しました')
    }
  }

  const handleDeleteThread = async () => {
    if (!window.confirm('このスレッドを削除します。よろしいですか？')) return
    try {
      if (isGeneral) {
        await deleteGeneralBoardThread(numericThreadId)
        navigate('/boards/general')
      } else {
        await deleteBoardThread(numericGameId, numericThreadId)
        navigate(`/boards/${numericGameId}`)
      }
    } catch (err: any) {
      window.alert(err.response?.data?.error || 'スレッド削除に失敗しました')
    }
  }

  const handleDeletePost = async (postId: number) => {
    if (!window.confirm('このコメントを削除します。よろしいですか？')) return
    try {
      if (isGeneral) {
        await deleteGeneralBoardPost(numericThreadId, postId)
      } else {
        await deleteBoardPost(numericGameId, numericThreadId, postId)
      }
      load()
    } catch (err: any) {
      window.alert(err.response?.data?.error || 'コメント削除に失敗しました')
    }
  }

  if (!detail) {
    return <div className="py-12 text-center text-sm text-gray-500">読み込み中...</div>
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 pb-40">
      <div className="mb-6 flex items-center gap-4">
        <Link to={isGeneral ? '/boards/general' : `/boards/${numericGameId}`} className="text-sm text-gray-300 hover:underline">← スレッド一覧</Link>
        <Link to="/boards" className="text-sm text-gray-500 hover:underline">← 掲示板一覧</Link>
      </div>

      <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900/90 p-6 shadow-lg">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.14em] text-amber-200/80">スレッドタイトル</p>
            <h1 className="text-2xl font-bold text-gray-100">{detail.thread.title}</h1>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
              <span className="rounded border border-zinc-700 px-2 py-1 text-[11px] font-medium tracking-[0.08em] text-amber-200/80">
                1コメ
              </span>
              <span>{detail.thread.gameName}</span>
              <span>{detail.thread.username}</span>
              <span>{new Date(detail.thread.createdAt).toLocaleString('ja-JP')}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin() && (
              <button
                type="button"
                onClick={handleDeleteThread}
                className="rounded border border-red-900/70 px-3 py-1.5 text-xs text-red-200 transition hover:border-red-700 hover:bg-red-950/40"
              >
                削除
              </button>
            )}
            <button
              type="button"
              onClick={handleThreadReport}
              className="rounded border border-zinc-700 px-3 py-1.5 text-xs text-gray-300 transition hover:border-red-700 hover:text-red-300"
            >
              通報
            </button>
          </div>
        </div>
        <div className="mt-5 whitespace-pre-wrap text-sm leading-7 text-gray-300">
          {detail.thread.content}
        </div>
      </div>

      <div className="space-y-3">
        {detail.posts.length === 0 ? (
          <p className="text-sm text-gray-500">返信はまだありません</p>
        ) : (
          detail.posts.map((post, index) => (
            <div key={post.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
                <div className="flex flex-wrap gap-3">
                  <span className="rounded border border-zinc-700 px-2 py-1 text-[11px] font-medium tracking-[0.08em] text-amber-200/80">
                    {index + 2}コメ
                  </span>
                  <span>{post.username}</span>
                  <span>{new Date(post.createdAt).toLocaleString('ja-JP')}</span>
                </div>
                <div className="flex items-center gap-2">
                  {isAdmin() && (
                    <button
                      type="button"
                      onClick={() => handleDeletePost(post.id)}
                      className="rounded border border-red-900/70 px-2 py-1 text-red-200 transition hover:border-red-700 hover:bg-red-950/40"
                    >
                      削除
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handlePostReport(post.id)}
                    className="rounded border border-zinc-700 px-2 py-1 text-gray-300 transition hover:border-red-700 hover:text-red-300"
                  >
                    通報
                  </button>
                </div>
              </div>
              <div className="whitespace-pre-wrap text-sm leading-7 text-gray-300">{post.content}</div>
            </div>
          ))
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-zinc-800 bg-black/90 backdrop-blur-md">
        <div className="mx-auto w-full max-w-5xl px-4 py-3">
          <form onSubmit={handleReply} className="space-y-2 rounded-2xl border border-zinc-800 bg-zinc-900/90 p-4 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-gray-100">返信する</h2>
              <p className="text-xs text-gray-400">表示名: {isLoggedIn() ? getUsername() : '名もなき褪せ人'}</p>
            </div>
            {error && <p className="text-sm text-red-300">{error}</p>}
            <div className="flex items-start gap-3">
              <textarea
                value={content}
                onChange={(e) => {
                  const next = e.target.value
                  if (next.length > 300) {
                    setLengthError('300文字までです')
                    setContent(next.slice(0, 300))
                    return
                  }
                  setLengthError('')
                  setContent(next)
                }}
                placeholder="返信内容"
                required
                rows={1}
                className="min-h-[42px] flex-1 rounded border border-gray-600 bg-zinc-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-800"
              />
              <button
                type="submit"
                className="shrink-0 rounded-md border border-amber-400/70 bg-gradient-to-b from-amber-300/30 via-amber-500/20 to-transparent px-5 py-2 text-sm font-semibold tracking-[0.08em] text-amber-50 shadow-[0_0_22px_rgba(245,158,11,0.16)] transition hover:border-amber-300/90 hover:bg-amber-300/24 hover:text-white"
              >
                返信する
              </button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                {lengthError && <p className="text-xs text-red-300">{lengthError}</p>}
              </div>
              <p className="text-xs text-gray-500">{content.length}/300</p>
            </div>
          </form>
        </div>
      </div>

      {showPostedOverlay && (
        <MessageOverlay
          message="メッセージを投稿しました"
          onClose={() => setShowPostedOverlay(false)}
        />
      )}
    </div>
  )
}
