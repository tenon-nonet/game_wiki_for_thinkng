import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getGames, createGame, updateGame, deleteGame, updateGameOrder } from '../api'
import type { GameFormData } from '../api'
import { isAdmin, isLoggedIn } from '../auth'
import type { Game } from '../types'

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const emptyForm = (): GameFormData => ({ name: '', description: '', platforms: '', releaseDates: '', awards: '', staff: '' })
  const [form, setForm] = useState<GameFormData>(emptyForm())
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<GameFormData>(emptyForm())
  const [editImage, setEditImage] = useState<File | null>(null)
  const [editPreview, setEditPreview] = useState<string | null>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const admin = isAdmin()
  const loggedIn = isLoggedIn()

  const load = async (q?: string) => {
    const res = await getGames(q)
    setGames(res.data)
  }

  useEffect(() => { load() }, [])

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    load(search || undefined)
  }

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    try {
      await createGame(form, image)
      setForm(emptyForm())
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
    setEditForm({
      name: game.name,
      description: game.description || '',
      platforms: game.platforms || '',
      releaseDates: game.releaseDates || '',
      awards: game.awards || '',
      staff: game.staff || '',
    })
    setEditImage(null)
    setEditPreview(null)
  }

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>, game: Game) => {
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
      <div className="flex flex-wrap items-center justify-between mb-6 gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-100">ゲーム一覧</h1>
        {loggedIn && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-red-900 hover:bg-red-800 text-white px-4 py-2 rounded text-sm whitespace-nowrap"
          >
            + ゲーム追加
          </button>
        )}
      </div>

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
          <input
            type="text"
            placeholder="プラットフォーム (例: PS5, PC, Xbox)"
            value={form.platforms}
            onChange={(e) => setForm({ ...form, platforms: e.target.value })}
            className="w-full border border-gray-600 rounded px-3 py-2 bg-zinc-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-800"
          />
          <textarea
            placeholder={"発売日 (例:\n本編: 2022/2/25\nDLC1: 2023/3/21)"}
            value={form.releaseDates}
            onChange={(e) => setForm({ ...form, releaseDates: e.target.value })}
            rows={3}
            className="w-full border border-gray-600 rounded px-3 py-2 bg-zinc-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-800"
          />
          <textarea
            placeholder={"受賞歴 (1行1件)"}
            value={form.awards}
            onChange={(e) => setForm({ ...form, awards: e.target.value })}
            rows={2}
            className="w-full border border-gray-600 rounded px-3 py-2 bg-zinc-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-800"
          />
          <textarea
            placeholder={"主要スタッフ (例:\nディレクター: 宮崎英高\nプロデューサー: XXX)"}
            value={form.staff}
            onChange={(e) => setForm({ ...form, staff: e.target.value })}
            rows={3}
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

      <form onSubmit={handleSearch} className="flex gap-2 mb-8 max-w-xl w-full">
        <input
          type="text"
          placeholder="ゲームを検索..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-gray-600 rounded px-3 py-2 bg-zinc-800 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-800"
        />
        <button type="submit" className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm">検索</button>
        {search && (
          <button type="button" onClick={() => { setSearch(''); load() }} className="bg-zinc-700 hover:bg-gray-600 text-gray-200 px-3 py-2 rounded text-sm">クリア</button>
        )}
      </form>

      {games.length === 0 ? (
        <p className="text-gray-500 text-sm">まだゲームが登録されていません</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {games.map((game, index) => (
            <div
              key={game.id}
              className={`bg-zinc-800 rounded-lg shadow overflow-hidden transition-all duration-200 ${admin ? 'cursor-grab active:cursor-grabbing' : ''} ${dragOverIndex === index && dragIndex !== index ? 'ring-2 ring-red-700 opacity-75' : ''}`}
              draggable={admin}
              onDragStart={() => admin && handleDragStart(index)}
              onDragOver={(e) => admin && handleDragOver(e, index)}
              onDrop={() => admin && handleDrop(index)}
              onDragEnd={handleDragEnd}
            >
              {editingId === game.id ? (
                <form onSubmit={(e) => handleUpdate(e, game)} className="p-5 sm:p-8 space-y-3">
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    required
                    className="w-full border border-gray-600 rounded px-3 py-2 bg-zinc-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-800 text-xl font-bold"
                  />
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={4}
                    className="w-full border border-gray-600 rounded px-3 py-2 bg-zinc-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-800"
                  />
                  <input
                    type="text"
                    placeholder="プラットフォーム"
                    value={editForm.platforms}
                    onChange={(e) => setEditForm({ ...editForm, platforms: e.target.value })}
                    className="w-full border border-gray-600 rounded px-3 py-2 bg-zinc-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-800"
                  />
                  <textarea
                    placeholder="発売日"
                    value={editForm.releaseDates}
                    onChange={(e) => setEditForm({ ...editForm, releaseDates: e.target.value })}
                    rows={3}
                    className="w-full border border-gray-600 rounded px-3 py-2 bg-zinc-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-800"
                  />
                  <textarea
                    placeholder="受賞歴"
                    value={editForm.awards}
                    onChange={(e) => setEditForm({ ...editForm, awards: e.target.value })}
                    rows={2}
                    className="w-full border border-gray-600 rounded px-3 py-2 bg-zinc-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-800"
                  />
                  <textarea
                    placeholder="主要スタッフ"
                    value={editForm.staff}
                    onChange={(e) => setEditForm({ ...editForm, staff: e.target.value })}
                    rows={3}
                    className="w-full border border-gray-600 rounded px-3 py-2 bg-zinc-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-800"
                  />
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">画像を変更</label>
                    {(editPreview || game.imagePath) && (
                      <img src={editPreview || `/uploads/${game.imagePath}`} alt="preview" className="w-24 h-24 object-cover rounded mb-2 border border-gray-600" />
                    )}
                    <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0] || null; setEditImage(f); setEditPreview(f ? URL.createObjectURL(f) : null) }} className="text-sm text-gray-400" />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="bg-red-900 hover:bg-red-800 text-white px-4 py-2 rounded text-sm">保存</button>
                    <button type="button" onClick={() => setEditingId(null)} className="bg-zinc-700 hover:bg-gray-600 text-gray-200 px-4 py-2 rounded text-sm">キャンセル</button>
                  </div>
                </form>
              ) : (
                <>
                  {game.imagePath && (
                    <img
                      src={`/uploads/${game.imagePath}`}
                      alt={game.name}
                      className="w-full max-h-96 object-contain bg-zinc-900"
                    />
                  )}
                  <div className="p-5 sm:p-8">
                    <div className="flex flex-wrap items-start justify-between mb-3 gap-2">
                      <Link to={`/games/${game.id}`} className="text-xl sm:text-2xl font-bold text-gray-100 hover:text-gray-300 transition">
                        {game.name}
                      </Link>
                      {admin && (
                        <div className="flex gap-2 flex-shrink-0">
                          <button onClick={() => startEdit(game)} className="text-gray-100 hover:text-gray-300 text-sm">編集</button>
                          <button onClick={() => handleDelete(game.id)} className="text-gray-100 hover:text-gray-300 text-sm">削除</button>
                        </div>
                      )}
                    </div>
                    {game.description && <p className="text-gray-300 mb-4 whitespace-pre-wrap">{game.description}</p>}
                    <dl className="text-sm space-y-2 mb-4">
                      {game.platforms && (
                        <div>
                          <dt className="text-gray-500 text-xs mb-0.5">プラットフォーム</dt>
                          <dd className="text-gray-200">{game.platforms}</dd>
                        </div>
                      )}
                      {game.releaseDates && (
                        <div>
                          <dt className="text-gray-500 text-xs mb-0.5">発売日</dt>
                          <dd className="text-gray-200 whitespace-pre-wrap">{game.releaseDates}</dd>
                        </div>
                      )}
                      {game.awards && (
                        <div>
                          <dt className="text-gray-500 text-xs mb-0.5">受賞歴</dt>
                          <dd className="text-gray-200 whitespace-pre-wrap">{game.awards}</dd>
                        </div>
                      )}
                      {game.staff && (
                        <div>
                          <dt className="text-gray-500 text-xs mb-0.5">主要スタッフ</dt>
                          <dd className="text-gray-200 whitespace-pre-wrap">{game.staff}</dd>
                        </div>
                      )}
                    </dl>
                    <p className="text-xs text-gray-500 mb-4">追加日: {new Date(game.createdAt).toLocaleDateString('ja-JP')}</p>
                    <div className="flex items-center justify-between">
                      <Link to={`/items?gameId=${game.id}`} className="border border-white/40 hover:border-white/70 text-white bg-transparent text-sm px-4 py-2 rounded transition">
                        アイテムを見る
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
