import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getItem, getItems, getGames, getTags, deleteItem, getComments, createComment, updateComment, deleteComment, toggleCommentLike } from '../api'
import { isLoggedIn, getUsername, isAdmin } from '../auth'
import type { Item, Comment, Game, Tag } from '../types'

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [item, setItem] = useState<Item | null>(null)
  const [relatedItems, setRelatedItems] = useState<Item[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [commentText, setCommentText] = useState('')
  const [commentError, setCommentError] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editText, setEditText] = useState('')
  const [games, setGames] = useState<Game[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [searchGameId, setSearchGameId] = useState('')
  const [searchTag, setSearchTag] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const loggedIn = isLoggedIn()
  const currentUser = getUsername()
  const admin = isAdmin()

  useEffect(() => {
    getGames().then((r) => setGames(r.data))
  }, [])

  useEffect(() => {
    if (searchGameId) {
      getTags(Number(searchGameId)).then((r) => setTags(r.data))
    } else {
      setTags([])
      setSearchTag('')
    }
  }, [searchGameId])

  useEffect(() => {
    const itemId = Number(id)
    getItem(itemId).then((res) => {
      const loaded = res.data
      setItem(loaded)
      setSearchGameId(String(loaded.gameId))
      if (loaded.tags.length > 0) {
        getItems(loaded.gameId).then((r) => {
          const tagIds = new Set(loaded.tags.map((t) => t.id))
          const related = r.data.filter(
            (i) => i.id !== itemId && i.tags.some((t) => tagIds.has(t.id))
          )
          setRelatedItems(related)
        })
      }
    })
    getComments(itemId).then((res) => setComments(res.data))
  }, [id])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (searchGameId) params.set('gameId', searchGameId)
    if (searchTag) params.set('tag', searchTag)
    if (searchKeyword) params.set('keyword', searchKeyword)
    navigate(`/items?${params.toString()}`)
  }

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

  const handleLike = async (commentId: number) => {
    if (!loggedIn) return
    try {
      const res = await toggleCommentLike(commentId)
      setComments((prev) => prev.map((c) => c.id === commentId ? res.data : c))
    } catch {
      // ignore
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
      <Link to="/items" className="text-red-700 hover:underline text-sm">← アイテム一覧</Link>

      {/* 検索バー */}
      <form onSubmit={handleSearch} className="mt-4 bg-zinc-800 rounded-lg p-4 flex flex-col sm:flex-row flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-400 mb-1">ゲーム</label>
          <select
            value={searchGameId}
            onChange={(e) => setSearchGameId(e.target.value)}
            className="w-full sm:w-auto border border-gray-600 rounded px-3 py-2 text-sm bg-zinc-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-800"
          >
            <option value="">すべて</option>
            {games.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">タグ</label>
          <select
            value={searchTag}
            onChange={(e) => setSearchTag(e.target.value)}
            className="w-full sm:w-auto border border-gray-600 rounded px-3 py-2 text-sm bg-zinc-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-800"
          >
            <option value="">すべて</option>
            {tags.map((t) => (
              <option key={t.id} value={t.name}>{t.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">キーワード</label>
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="例: ルーン"
            className="w-full sm:w-auto border border-gray-600 rounded px-3 py-2 text-sm bg-zinc-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-800"
          />
        </div>
        <button type="submit" className="border border-white/40 hover:border-white/70 text-white bg-transparent px-4 py-2 rounded text-sm transition">
          検索
        </button>
      </form>

      <div className="bg-zinc-800 rounded-lg shadow mt-4 overflow-hidden">
        {item.imagePath ? (
          <img
            src={`/uploads/${item.imagePath}`}
            alt={item.name}
            className="w-full max-h-[500px] object-contain bg-zinc-900"
          />
        ) : (
          <div className="w-full h-48 bg-zinc-700 flex items-center justify-center text-gray-500">
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
                  className="text-red-700 hover:underline text-sm"
                >
                  編集
                </Link>
                <button onClick={handleDelete} className="text-red-600 hover:underline text-sm">
                  削除
                </button>
              </div>
            )}
          </div>

          <Link to={`/games/${item.gameId}`} className="text-red-700 hover:underline text-sm">
            {item.gameName}
          </Link>

          {item.description && (
            <p className="text-gray-300 mt-4 whitespace-pre-wrap">{item.description}</p>
          )}

          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {item.tags.map((t) => (
                <span key={t.id} className="bg-red-950 text-red-200 text-sm px-3 py-1 rounded-full">
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

      {/* 関連アイテム */}
      {relatedItems.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-gray-100 mb-4">関連アイテム</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {relatedItems.map((related) => (
              <Link
                key={related.id}
                to={`/items/${related.id}`}
                className="group bg-zinc-800 rounded-lg overflow-hidden hover:ring-1 hover:ring-red-700 transition"
              >
                {related.imagePath ? (
                  <img
                    src={`/uploads/${related.imagePath}`}
                    alt={related.name}
                    className="w-full h-32 object-contain bg-zinc-900"
                  />
                ) : (
                  <div className="w-full h-32 bg-zinc-700 flex items-center justify-center text-gray-500 text-xs">
                    画像なし
                  </div>
                )}
                <div className="p-2">
                  <p className="text-gray-100 text-sm font-medium line-clamp-1">{related.name}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {related.tags
                      .filter((t) => item?.tags.some((it) => it.id === t.id))
                      .map((t) => (
                        <span key={t.id} className="bg-red-950 text-red-200 text-xs px-1.5 py-0.5 rounded-full">
                          {t.name}
                        </span>
                      ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* コメント・考察セクション */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-gray-100 mb-4">考察・コメント</h2>

        {loggedIn && (
          <form onSubmit={handleCommentSubmit} className="bg-zinc-800 rounded-lg p-4 mb-6">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="考察・メモを書く..."
              rows={3}
              required
              className="w-full border border-gray-600 rounded px-3 py-2 bg-zinc-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-800 text-sm resize-none"
            />
            {commentError && <p className="text-red-600 text-xs mt-1">{commentError}</p>}
            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="bg-red-900 hover:bg-red-800 text-white text-sm px-4 py-1.5 rounded disabled:opacity-40"
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
              <li key={c.id} className="bg-zinc-800 rounded-lg px-4 py-3">
                <div className="flex flex-wrap items-center justify-between mb-1 gap-1">
                  <span className="text-red-700 text-xs font-medium">{c.username}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-xs">
                      {new Date(c.createdAt).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {c.username === currentUser && editingId !== c.id && (
                      <button onClick={() => startEdit(c)} className="text-red-700 hover:text-red-600 text-xs">
                        編集
                      </button>
                    )}
                    {(admin || c.username === currentUser) && (
                      <button onClick={() => handleCommentDelete(c.id)} className="text-red-600 hover:text-red-300 text-xs">
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
                      className="w-full border border-gray-600 rounded px-3 py-2 bg-zinc-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-800 text-sm resize-none"
                    />
                    {commentError && <p className="text-red-600 text-xs mt-1">{commentError}</p>}
                    <div className="flex gap-2 justify-end mt-2">
                      <button type="submit" disabled={!editText.trim()} className="bg-red-900 hover:bg-red-800 text-white text-xs px-3 py-1.5 rounded disabled:opacity-40">保存</button>
                      <button type="button" onClick={() => setEditingId(null)} className="bg-zinc-700 hover:bg-gray-600 text-gray-200 text-xs px-3 py-1.5 rounded">キャンセル</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <p className="text-gray-200 text-sm whitespace-pre-wrap">{c.content}</p>
                    <div className="mt-2">
                      <button
                        onClick={() => handleLike(c.id)}
                        disabled={!loggedIn}
                        className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded transition ${c.likedByMe ? 'text-red-400' : 'text-gray-500 hover:text-red-400'} disabled:cursor-default`}
                      >
                        <span>{c.likedByMe ? '♥' : '♡'}</span>
                        <span>{c.likeCount > 0 ? c.likeCount : ''}</span>
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
