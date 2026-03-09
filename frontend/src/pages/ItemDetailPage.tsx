import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getItem, deleteItem, getComments, createComment, updateComment, deleteComment } from '../api'
import { isLoggedIn, getUsername, isAdmin } from '../auth'
import type { Item, Comment } from '../types'

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [item, setItem] = useState<Item | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentText, setCommentText] = useState('')
  const [commentError, setCommentError] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editText, setEditText] = useState('')
  const loggedIn = isLoggedIn()
  const currentUser = getUsername()
  const admin = isAdmin()

  useEffect(() => {
    getItem(Number(id)).then((res) => setItem(res.data))
    getComments(Number(id)).then((res) => setComments(res.data))
  }, [id])

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCommentError('')
    try {
      const res = await createComment(Number(id), commentText.trim())
      setComments((prev) => [res.data, ...prev])
      setCommentText('')
    } catch {
      setCommentError('コメントの投稿に失敗しました')
    }
  }

  const startEdit = (c: Comment) => {
    setEditingId(c.id)
    setEditText(c.content)
    setCommentError('')
  }

  const handleCommentUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId == null) return
    setCommentError('')
    try {
      const res = await updateComment(editingId, editText.trim())
      setComments((prev) => prev.map((c) => c.id === editingId ? res.data : c))
      setEditingId(null)
    } catch {
      setCommentError('コメントの更新に失敗しました')
    }
  }

  const handleCommentDelete = async (commentId: number) => {
    if (!confirm('このコメントを削除しますか？')) return
    try {
      await deleteComment(commentId)
      setComments((prev) => prev.filter((c) => c.id !== commentId))
    } catch {
      setCommentError('コメントの削除に失敗しました')
    }
  }

  const handleDelete = async () => {
    if (!confirm('このアイテムを削除しますか？')) return
    await deleteItem(Number(id))
    navigate('/items')
  }

  if (!item) return <div className="text-center py-12 text-gray-400">読み込み中...</div>

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-8 py-6 sm:py-10">
      <Link to="/items" className="text-indigo-400 hover:underline text-sm">← アイテム一覧</Link>

      <div className="bg-gray-800 rounded-lg shadow mt-4 overflow-hidden">
        {item.imagePath ? (
          <img
            src={`/uploads/${item.imagePath}`}
            alt={item.name}
            className="w-full max-h-[500px] object-contain bg-gray-900"
          />
        ) : (
          <div className="w-full h-48 bg-gray-700 flex items-center justify-center text-gray-500">
            画像なし
          </div>
        )}

        <div className="p-5 sm:p-8">
          <div className="flex flex-wrap items-start justify-between mb-3 gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-100">{item.name}</h1>
            {loggedIn && (
              <div className="flex gap-2 flex-shrink-0">
                <Link
                  to={`/items/${item.id}/edit`}
                  className="text-indigo-400 hover:underline text-sm"
                >
                  編集
                </Link>
                <button onClick={handleDelete} className="text-red-400 hover:underline text-sm">
                  削除
                </button>
              </div>
            )}
          </div>

          <Link to={`/games/${item.gameId}`} className="text-indigo-400 hover:underline text-sm">
            {item.gameName}
          </Link>

          {item.description && (
            <p className="text-gray-300 mt-4 whitespace-pre-wrap">{item.description}</p>
          )}

          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {item.tags.map((t) => (
                <span key={t.id} className="bg-indigo-900 text-indigo-300 text-sm px-3 py-1 rounded-full">
                  {t.name}
                </span>
              ))}
            </div>
          )}

          <p className="text-xs text-gray-500 mt-6">
            追加日: {new Date(item.createdAt).toLocaleDateString('ja-JP')}
          </p>
        </div>
      </div>

      {/* コメント・考察セクション */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-gray-100 mb-4">考察・コメント</h2>

        {loggedIn && (
          <form onSubmit={handleCommentSubmit} className="bg-gray-800 rounded-lg p-4 mb-6">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="考察・メモを書く..."
              rows={3}
              required
              className="w-full border border-gray-600 rounded px-3 py-2 bg-gray-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
            />
            {commentError && <p className="text-red-400 text-xs mt-1">{commentError}</p>}
            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-1.5 rounded disabled:opacity-40"
              >
                投稿
              </button>
            </div>
          </form>
        )}

        {comments.length === 0 ? (
          <p className="text-gray-500 text-sm">まだコメントはありません</p>
        ) : (
          <ul className="space-y-3">
            {comments.map((c) => (
              <li key={c.id} className="bg-gray-800 rounded-lg px-4 py-3">
                <div className="flex flex-wrap items-center justify-between mb-1 gap-1">
                  <span className="text-indigo-400 text-xs font-medium">{c.username}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-xs">
                      {new Date(c.createdAt).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {c.username === currentUser && editingId !== c.id && (
                      <button onClick={() => startEdit(c)} className="text-indigo-400 hover:text-indigo-300 text-xs">
                        編集
                      </button>
                    )}
                    {(admin || c.username === currentUser) && (
                      <button onClick={() => handleCommentDelete(c.id)} className="text-red-400 hover:text-red-300 text-xs">
                        削除
                      </button>
                    )}
                  </div>
                </div>
                {editingId === c.id ? (
                  <form onSubmit={handleCommentUpdate} className="mt-1">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={3}
                      required
                      className="w-full border border-gray-600 rounded px-3 py-2 bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                    />
                    {commentError && <p className="text-red-400 text-xs mt-1">{commentError}</p>}
                    <div className="flex gap-2 justify-end mt-2">
                      <button type="submit" disabled={!editText.trim()} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded disabled:opacity-40">保存</button>
                      <button type="button" onClick={() => setEditingId(null)} className="bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs px-3 py-1.5 rounded">キャンセル</button>
                    </div>
                  </form>
                ) : (
                  <p className="text-gray-200 text-sm whitespace-pre-wrap">{c.content}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
