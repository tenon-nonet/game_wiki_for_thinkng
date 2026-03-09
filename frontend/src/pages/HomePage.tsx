import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getGames, createGame, updateGame, deleteGame, updateGameOrder } from '../api'
import { isAdmin, isLoggedIn } from '../auth'
import type { Game } from '../types'

export default function HomePage() {
  const [games, setGames] = useState<Game[]>([])
  const [search, setSearch] = useState('')
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
  const loggedIn = isLoggedIn()
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const load = async (q?: string) => {
    const res = await getGames(q)
    setGames(res.data)
  }

  useEffect(() => { load() }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    load(search || undefined)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await createGame(form.name, form.description, image)
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
    await updateGame(game.id, editForm.name, editForm.description, editImage)
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
      {/* ヘッダー */}
      <div className="text-center mb-8 sm:mb-12">
        <div className="max-w-3xl mx-auto bg-gray-800 rounded-xl p-5 sm:p-8 text-left space-y-3 text-base text-gray-300">
          <p><span className="text-gray-100 font-medium">Enlightmenter's Archives</span> は、ゲームに登場するアイテムの情報をみんなで共有・編集できるWikiサービスです。</p>
          <div className="flex gap-3 pt-2">
            <Link to="/items" className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded text-base font-medium transition">
              アイテム一覧を見る
            </Link>
          </div>
        </div>
      </div>

      {/* ゲーム一覧 */}
      <section>
        <div className="flex items-center justify-between mb-6 gap-3">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-200">ゲーム一覧</h2>
          {loggedIn && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded text-sm whitespace-nowrap"
            >
              + ゲーム追加
            </button>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="bg-gray-800 rounded-lg shadow p-4 mb-6 space-y-3">
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <input
              type="text"
              placeholder="ゲーム名"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="w-full border border-gray-600 rounded px-3 py-2 bg-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <textarea
              placeholder="説明"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full border border-gray-600 rounded px-3 py-2 bg-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div>
              <label className="block text-sm text-gray-300 mb-1">画像</label>
              {preview && <img src={preview} alt="preview" className="w-full h-32 object-contain bg-gray-900 rounded mb-2 border border-gray-600" />}
              <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0] || null; setImage(f); setPreview(f ? URL.createObjectURL(f) : null) }} className="text-sm text-gray-400" />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded text-sm">保存</button>
              <button type="button" onClick={() => { setShowForm(false); setImage(null); setPreview(null) }} className="bg-gray-700 hover:bg-gray-600 text-gray-200 px-4 py-2 rounded text-sm">キャンセル</button>
            </div>
          </form>
        )}

        <form onSubmit={handleSearch} className="flex gap-2 mb-6 max-w-xl w-full">
          <input
            type="text"
            placeholder="ゲームを検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border border-gray-600 rounded px-3 py-2 bg-gray-800 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button type="submit" className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm">検索</button>
          {search && (
            <button type="button" onClick={() => { setSearch(''); load() }} className="bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-2 rounded text-sm">クリア</button>
          )}
        </form>

        {games.length === 0 ? (
          <p className="text-gray-500 text-sm">まだゲームが登録されていません</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {games.map((game, index) => (
              <div
                key={game.id}
                className={`group bg-gray-800 rounded-xl shadow overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${admin ? 'cursor-grab active:cursor-grabbing' : ''} ${dragOverIndex === index && dragIndex !== index ? 'ring-2 ring-indigo-400 opacity-75' : ''}`}
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
                      className="w-full border border-gray-600 rounded px-3 py-2 bg-gray-700 text-gray-100 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      rows={2}
                      className="w-full border border-gray-600 rounded px-3 py-2 bg-gray-700 text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <div>
                      <label className="block text-xs text-gray-300 mb-1">画像を変更</label>
                      {(editPreview || game.imagePath) && (
                        <img src={editPreview || `/uploads/${game.imagePath}`} alt="preview" className="w-full h-32 object-contain bg-gray-900 rounded mb-2 border border-gray-600" />
                      )}
                      <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0] || null; setEditImage(f); setEditPreview(f ? URL.createObjectURL(f) : null) }} className="text-xs text-gray-400" />
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded text-sm">保存</button>
                      <button type="button" onClick={() => setEditingId(null)} className="bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1.5 rounded text-sm">キャンセル</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <Link to={`/games/${game.id}`} className="block overflow-hidden">
                      {game.imagePath ? (
                        <img src={`/uploads/${game.imagePath}`} alt={game.name} className="w-full h-64 object-contain bg-gray-900 transition-transform duration-500 ease-out group-hover:scale-125" />
                      ) : (
                        <div className="w-full h-64 bg-gray-700 flex items-center justify-center text-gray-500 text-sm">画像なし</div>
                      )}
                    </Link>
                    <div className="p-5 flex flex-col gap-1">
                      <div className="flex items-start justify-between">
                        <Link to={`/games/${game.id}`} className="text-xl font-semibold text-indigo-400 hover:underline">
                          {game.name}
                        </Link>
                        {admin && (
                          <div className="flex gap-2 ml-2 flex-shrink-0">
                            <button onClick={() => startEdit(game)} className="text-indigo-400 hover:text-indigo-300 text-sm">編集</button>
                            <button onClick={() => handleDelete(game.id)} className="text-red-400 hover:text-red-300 text-sm">削除</button>
                          </div>
                        )}
                      </div>
                      {game.description && <p className="text-gray-400 text-sm line-clamp-2">{game.description}</p>}
                      <Link to={`/items?gameId=${game.id}`} className="mt-3 inline-block bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded transition">アイテムを見る →</Link>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
