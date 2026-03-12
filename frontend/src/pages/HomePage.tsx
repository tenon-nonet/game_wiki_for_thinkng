import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getGames, createGame, updateGame, deleteGame, updateGameOrder, getNews } from '../api'
import { isAdmin } from '../auth'
import type { Game } from '../types'

export default function HomePage() {
  const [games, setGames] = useState<Game[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({ name: '', description: '' })
  const [editImage, setEditImage] = useState<File | null>(null)
  const [editPreview, setEditPreview] = useState<string | null>(null)
  const admin = isAdmin()
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [news, setNews] = useState<{ title: string; url: string; publishedAt: string; source: string }[]>([])
  const [newsLoading, setNewsLoading] = useState(false)

  const load = async (q?: string) => {
    const res = await getGames(q)
    setGames(res.data)
    if (!q && res.data.length > 0) {
      setNewsLoading(true)
      const query = res.data.map((g) => g.name).join(' OR ')
      getNews(query, 5).then((r) => {
        setNews(r.data)
        setNewsLoading(false)
      }).catch(() => setNewsLoading(false))
    }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await createGame(form, image)
      setForm({ name: '', description: '' })
      setImage(null)
      setPreview(null)
      setShowForm(false)
      load()
    } catch (err: any) {
      setError(err.response?.data?.error || '追加に失敗しました')
    }
  }

  const startEdit = (game: Game) => {
    setEditingId(game.id)
    setEditForm({ name: game.name, description: game.description || '' })
    setEditImage(null)
    setEditPreview(null)
  }

  const handleUpdate = async (e: React.FormEvent, game: Game) => {
    e.preventDefault()
    await updateGame(game.id, editForm, editImage)
    setEditingId(null)
    load()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('削除しますか？')) return
    await deleteGame(id)
    load()
  }

  const handleDragStart = (index: number) => setDragIndex(index)

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDrop = async (index: number) => {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null)
      setDragOverIndex(null)
      return
    }
    const newGames = [...games]
    const [moved] = newGames.splice(dragIndex, 1)
    newGames.splice(index, 0, moved)
    setGames(newGames)
    setDragIndex(null)
    setDragOverIndex(null)
    await updateGameOrder(newGames.map((g) => g.id))
  }

  const handleDragEnd = () => {
    setDragIndex(null)
    setDragOverIndex(null)
  }

  return (
    <div className="w-full px-4 sm:px-8 py-6 sm:py-10">
      {/* ゲーム一覧 */}
      <section>
        {admin && (
          <div className="flex justify-end mb-6">
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-red-900 hover:bg-red-800 text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded text-sm whitespace-nowrap"
            >
              + ゲーム追加
            </button>
          </div>
        )}

        {showForm && (
          <form onSubmit={handleCreate} className="bg-zinc-800 rounded-lg shadow p-4 mb-6 space-y-3">
            {error && <p className="text-gray-100 text-sm">{error}</p>}
            <input
              type="text"
              placeholder="ゲーム名"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="w-full border border-gray-600 rounded px-3 py-2 bg-zinc-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-800"
            />
            <textarea
              placeholder="説明"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full border border-gray-600 rounded px-3 py-2 bg-zinc-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-800"
            />
            <div>
              <label className="block text-sm text-gray-300 mb-1">画像</label>
              {preview && <img src={preview} alt="preview" className="w-full h-32 object-contain bg-zinc-900 rounded mb-2 border border-gray-600" />}
              <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0] || null; setImage(f); setPreview(f ? URL.createObjectURL(f) : null) }} className="text-sm text-gray-400" />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-red-900 hover:bg-red-800 text-white px-4 py-2 rounded text-sm">保存</button>
              <button type="button" onClick={() => { setShowForm(false); setImage(null); setPreview(null) }} className="bg-zinc-700 hover:bg-gray-600 text-gray-200 px-4 py-2 rounded text-sm">キャンセル</button>
            </div>
          </form>
        )}

        {games.length === 0 ? (
          <p className="text-gray-500 text-sm">まだゲームが登録されていません</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game, index) => (
              <div
                key={game.id}
                className={`group bg-zinc-800 rounded-xl shadow overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${admin ? 'cursor-grab active:cursor-grabbing' : ''} ${dragOverIndex === index && dragIndex !== index ? 'ring-2 ring-red-700 opacity-75' : ''}`}
                draggable={admin}
                onDragStart={() => admin && handleDragStart(index)}
                onDragOver={(e) => admin && handleDragOver(e, index)}
                onDrop={() => admin && handleDrop(index)}
                onDragEnd={handleDragEnd}
              >
                {editingId === game.id ? (
                  <form onSubmit={(e) => handleUpdate(e, game)} className="p-4 space-y-3">
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      required
                      className="w-full border border-gray-600 rounded px-3 py-2 bg-zinc-700 text-gray-100 font-semibold focus:outline-none focus:ring-2 focus:ring-red-800"
                    />
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      rows={2}
                      className="w-full border border-gray-600 rounded px-3 py-2 bg-zinc-700 text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-800"
                    />
                    <div>
                      <label className="block text-xs text-gray-300 mb-1">画像を変更</label>
                      {(editPreview || game.imagePath) && (
                        <img src={editPreview || `/uploads/${game.imagePath}`} alt="preview" className="w-full h-32 object-contain bg-zinc-900 rounded mb-2 border border-gray-600" />
                      )}
                      <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0] || null; setEditImage(f); setEditPreview(f ? URL.createObjectURL(f) : null) }} className="text-xs text-gray-400" />
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="bg-red-900 hover:bg-red-800 text-white px-3 py-1.5 rounded text-sm">保存</button>
                      <button type="button" onClick={() => setEditingId(null)} className="bg-zinc-700 hover:bg-gray-600 text-gray-200 px-3 py-1.5 rounded text-sm">キャンセル</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <Link to={`/games/${game.id}`} className="block overflow-hidden">
                      {game.imagePath ? (
                        <img src={`/uploads/${game.imagePath}`} alt={game.name} className="w-full h-64 object-contain bg-zinc-900 transition-all duration-300 ease-out group-hover:opacity-75 group-hover:blur-[2px]" />
                      ) : (
                        <div className="w-full h-64 bg-zinc-700 flex items-center justify-center text-gray-500 text-sm">画像なし</div>
                      )}
                    </Link>
                    <div className="p-5 flex flex-col gap-1">
                      <div className="flex items-start justify-between">
                        <Link to={`/games/${game.id}`} className="text-xl font-semibold text-gray-100 hover:underline">
                          {game.name}
                        </Link>
                        {admin && (
                          <div className="flex gap-2 ml-2 flex-shrink-0">
                            <button onClick={() => startEdit(game)} className="text-gray-100 hover:text-gray-300 text-sm">編集</button>
                            <button onClick={() => handleDelete(game.id)} className="text-gray-100 hover:text-gray-300 text-sm">削除</button>
                          </div>
                        )}
                      </div>
                      {game.description && <p className="text-gray-400 text-sm line-clamp-2">{game.description}</p>}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Link
                          to={`/items?gameId=${game.id}`}
                          className="inline-block border border-white/40 hover:border-white/70 text-white bg-transparent text-sm px-4 py-2 rounded transition"
                        >
                          アイテム一覧 →
                        </Link>
                        <Link
                          to={`/bosses?gameId=${game.id}`}
                          className="inline-block border border-white/40 hover:border-white/70 text-white bg-transparent text-sm px-4 py-2 rounded transition"
                        >
                          ボス一覧 →
                        </Link>
                        <Link
                          to={`/npcs?gameId=${game.id}`}
                          className="inline-block border border-white/40 hover:border-white/70 text-white bg-transparent text-sm px-4 py-2 rounded transition"
                        >
                          NPC一覧 →
                        </Link>
                        <Link
                          to={`/games/${game.id}`}
                          className="inline-block border border-white/40 hover:border-white/70 text-white bg-transparent text-sm px-4 py-2 rounded transition"
                        >
                          ゲーム詳細 →
                        </Link>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ゲーム関連ニュース */}
      {(newsLoading || news.length > 0) && (
        <section className="mt-12 max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-200">ゲーム関連ニュース</h2>
            {!newsLoading && news.length > 0 && (
              <Link to="/news" className="text-gray-100 hover:underline text-sm">
                ニュース一覧はコチラ →
              </Link>
            )}
          </div>
          {newsLoading ? (
            <p className="text-gray-500 text-sm">読み込み中...</p>
          ) : (
            <ul className="space-y-2">
              {news.map((item, i) => (
                <li key={i} className="bg-zinc-800 rounded-lg px-4 py-3">
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-gray-100 text-sm hover:text-gray-300 transition line-clamp-2">
                    {item.title}
                  </a>
                  <div className="flex gap-3 mt-1 text-xs text-gray-500">
                    {item.source && <span>{item.source}</span>}
                    {item.publishedAt && <span>{new Date(item.publishedAt).toLocaleDateString('ja-JP')}</span>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}
