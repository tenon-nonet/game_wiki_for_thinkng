import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { getItem, getItems, deleteItem, getComments, createComment, updateComment, deleteComment, toggleCommentLike } from '../api'
import { isLoggedIn, getUsername, isAdmin } from '../auth'
import type { Item, Comment } from '../types'

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const fromCatalogInState = Boolean((location.state as { fromCatalog?: boolean } | null)?.fromCatalog)
  const fromCatalog = searchParams.get('from') === 'catalog' || fromCatalogInState
  const catalogGameId = searchParams.get('gameId')
  const catalogTab = searchParams.get('tab') ?? 'ITEM'
  const catalogUrl = `/catalog${catalogGameId ? `?gameId=${catalogGameId}&tab=${catalogTab}` : ''}`
  const detailQueryFromCatalog = `?from=catalog${catalogGameId ? `&gameId=${catalogGameId}` : ''}&tab=${catalogTab}`
  const [item, setItem] = useState<Item | null>(null)
  const [relatedItems, setRelatedItems] = useState<Item[]>([])
  const [prevItem, setPrevItem] = useState<Item | null>(null)
  const [nextItem, setNextItem] = useState<Item | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentText, setCommentText] = useState('')
  const [commentError, setCommentError] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editText, setEditText] = useState('')
  const [replyToId, setReplyToId] = useState<number | null>(null)
  const [replyText, setReplyText] = useState('')
  const loggedIn = isLoggedIn()
  const currentUser = getUsername()
  const admin = isAdmin()

  useEffect(() => {
    const itemId = Number(id)
    getItem(itemId).then((res) => {
      const loaded = res.data
      setItem(loaded)
      getItems(loaded.gameId).then((r) => {
        const gameItems = [...r.data].sort((a, b) => a.id - b.id)
        const currentIndex = gameItems.findIndex((i) => i.id === itemId)
        setPrevItem(currentIndex > 0 ? gameItems[currentIndex - 1] : null)
        setNextItem(currentIndex >= 0 && currentIndex < gameItems.length - 1 ? gameItems[currentIndex + 1] : null)

        if (loaded.tags.length > 0) {
          const tagIds = new Set(loaded.tags.map((t) => t.id))
          const related = gameItems.filter(
            (i) => i.id !== itemId && i.tags.some((t) => tagIds.has(t.id))
          )
          setRelatedItems(related)
        } else {
          setRelatedItems([])
        }
      })
    })
    getComments(itemId).then((res) => setComments(res.data))
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
      setComments((prev) => prev
        .filter((c) => c.id !== commentId)
        .map((c) => ({ ...c, replies: c.replies.filter((r) => r.id !== commentId) }))
      )
    } catch {
      setCommentError('コメントの削除に失敗しました')
    }
  }

  const handleReplySubmit = async (e: React.FormEvent, parentId: number) => {
    e.preventDefault()
    setCommentError('')
    try {
      const res = await createComment(Number(id), replyText.trim(), parentId)
      setComments((prev) => prev.map((c) =>
        c.id === parentId ? { ...c, replies: [...(c.replies || []), res.data] } : c
      ))
      setReplyText('')
      setReplyToId(null)
    } catch {
      setCommentError('返信の投稿に失敗しました')
    }
  }

  const handleLike = async (commentId: number) => {
    try {
      const res = await toggleCommentLike(commentId)
      setComments((prev) => prev.map((c) => {
        if (c.id === commentId) return { ...res.data, replies: c.replies }
        return { ...c, replies: c.replies.map((r) => r.id === commentId ? res.data : r) }
      }))
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
      <div className="space-y-2">
        <div className="flex items-center justify-start">
          <Link to={fromCatalog ? catalogUrl : '/items'} className="text-gray-100 hover:underline text-sm">
            ← {fromCatalog ? '目録へ' : 'アイテム一覧へ'}
          </Link>
        </div>
        <div className="flex items-center justify-between gap-3">
          {prevItem ? (
            <Link to={`/items/${prevItem.id}${fromCatalog ? detailQueryFromCatalog : ''}`} className="min-w-0 flex-1 text-gray-300 hover:underline text-sm truncate">
              ← {prevItem.name}
            </Link>
          ) : (
            <span className="flex-1" />
          )}
          {nextItem ? (
            <Link to={`/items/${nextItem.id}${fromCatalog ? detailQueryFromCatalog : ''}`} className="min-w-0 flex-1 text-gray-300 hover:underline text-sm truncate text-right">
              {nextItem.name} →
            </Link>
          ) : (
            <span className="flex-1" />
          )}
        </div>
      </div>

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
                  className="text-gray-100 hover:underline text-sm"
                >
                  編集
                </Link>
                {admin && (
                  <button onClick={handleDelete} className="text-gray-100 hover:underline text-sm">
                    削除
                  </button>
                )}
              </div>
            )}
          </div>

          <Link to={`/games/${item.gameId}`} className="text-gray-100 hover:underline text-sm">
            {item.gameName}
          </Link>

          {item.description && (
            <p className="text-gray-300 mt-4 whitespace-pre-wrap">{item.description}</p>
          )}

          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {item.tags.map((t) => (
                <span key={t.id} className="bg-red-950 text-white text-sm px-3 py-1 rounded-full">
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
                        <span key={t.id} className="bg-red-950 text-white text-xs px-1.5 py-0.5 rounded-full">
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

      {/* コメントセクション */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-gray-100 mb-5">コメント</h2>

        <form onSubmit={handleCommentSubmit} className="bg-zinc-800 rounded-lg p-5 mb-6">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="コメントを書く..."
              rows={4}
              required
              className="w-full border border-gray-600 rounded px-4 py-3 bg-zinc-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-800 text-base resize-none"
            />
            {commentError && <p className="text-gray-100 text-sm mt-2">{commentError}</p>}
            <div className="flex justify-end mt-3">
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="bg-red-900 hover:bg-red-800 text-white text-base px-5 py-2 rounded disabled:opacity-40"
              >
                投稿
              </button>
            </div>
        </form>

        {comments.length === 0 ? (
          <p className="text-gray-500 text-base">まだコメントはありません</p>
        ) : (
          <ul className="space-y-4">
            {comments.map((c) => (
              <li key={c.id} className="bg-zinc-800 rounded-lg px-5 py-4">
                {/* コメントヘッダー */}
                <div className="flex flex-wrap items-center justify-between mb-2 gap-1">
                  <span className="text-gray-100 text-sm font-semibold">{c.username}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 text-xs">
                      {new Date(c.createdAt).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {c.username === currentUser && editingId !== c.id && (
                      <button onClick={() => startEdit(c)} className="text-gray-100 hover:text-gray-300 text-sm">編集</button>
                    )}
                    {(admin || c.username === currentUser) && (
                      <button onClick={() => handleCommentDelete(c.id)} className="text-gray-100 hover:text-gray-300 text-sm">削除</button>
                    )}
                  </div>
                </div>

                {/* コメント本文 or 編集フォーム */}
                {editingId === c.id ? (
                  <form onSubmit={handleCommentUpdate} className="mt-1">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={4}
                      required
                      className="w-full border border-gray-600 rounded px-4 py-3 bg-zinc-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-800 text-base resize-none"
                    />
                    {commentError && <p className="text-gray-100 text-sm mt-2">{commentError}</p>}
                    <div className="flex gap-2 justify-end mt-2">
                      <button type="submit" disabled={!editText.trim()} className="bg-red-900 hover:bg-red-800 text-white text-sm px-4 py-2 rounded disabled:opacity-40">保存</button>
                      <button type="button" onClick={() => setEditingId(null)} className="bg-zinc-700 hover:bg-gray-600 text-gray-200 text-sm px-4 py-2 rounded">キャンセル</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <p className="text-gray-100 text-base whitespace-pre-wrap leading-relaxed">{c.content}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <button
                        onClick={() => handleLike(c.id)}

                        className={`flex items-center gap-1.5 text-sm transition ${c.likedByMe ? 'text-white' : 'text-gray-500 hover:text-gray-300'} disabled:cursor-default`}
                      >
                        <span className="text-base">{c.likedByMe ? '♥' : '♡'}</span>
                        {c.likeCount > 0 && <span>{c.likeCount}</span>}
                      </button>
                      <button
                        onClick={() => setReplyToId(replyToId === c.id ? null : c.id)}
                        className="text-sm text-gray-500 hover:text-gray-300 transition"
                      >
                        返信
                      </button>
                    </div>
                  </>
                )}

                {/* 返信フォーム */}
                {replyToId === c.id && (
                  <form onSubmit={(e) => handleReplySubmit(e, c.id)} className="mt-4 ml-5 border-l-2 border-zinc-600 pl-4">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={`${c.username} への返信...`}
                      rows={3}
                      required
                      className="w-full border border-gray-600 rounded px-4 py-3 bg-zinc-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-800 text-base resize-none"
                    />
                    {commentError && <p className="text-gray-100 text-sm mt-2">{commentError}</p>}
                    <div className="flex gap-2 justify-end mt-2">
                      <button type="submit" disabled={!replyText.trim()} className="bg-red-900 hover:bg-red-800 text-white text-sm px-4 py-2 rounded disabled:opacity-40">返信する</button>
                      <button type="button" onClick={() => { setReplyToId(null); setReplyText('') }} className="bg-zinc-700 hover:bg-gray-600 text-gray-200 text-sm px-4 py-2 rounded">キャンセル</button>
                    </div>
                  </form>
                )}

                {/* 返信一覧 */}
                {c.replies && c.replies.length > 0 && (
                  <ul className="mt-4 ml-5 border-l-2 border-zinc-600 pl-4 space-y-3">
                    {c.replies.map((rep) => (
                      <li key={rep.id} className="bg-zinc-700 rounded-lg px-4 py-3">
                        <div className="flex flex-wrap items-center justify-between mb-2 gap-1">
                          <span className="text-gray-100 text-sm font-semibold">{rep.username}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-gray-500 text-xs">
                              {new Date(rep.createdAt).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {(admin || rep.username === currentUser) && (
                              <button onClick={() => handleCommentDelete(rep.id)} className="text-gray-100 hover:text-gray-300 text-sm">削除</button>
                            )}
                          </div>
                        </div>
                        <p className="text-gray-100 text-base whitespace-pre-wrap leading-relaxed">{rep.content}</p>
                        <button
                          onClick={() => handleLike(rep.id)}
  
                          className={`flex items-center gap-1.5 text-sm mt-2 transition ${rep.likedByMe ? 'text-white' : 'text-gray-500 hover:text-gray-300'} disabled:cursor-default`}
                        >
                          <span className="text-base">{rep.likedByMe ? '♥' : '♡'}</span>
                          {rep.likeCount > 0 && <span>{rep.likeCount}</span>}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
