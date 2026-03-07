import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getGames, createGame, deleteGame } from '../api'
import { isAdmin, isLoggedIn } from '../auth'
import type { Game } from '../types'

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState('')
  const admin = isAdmin()
  const loggedIn = isLoggedIn()

  const load = async (q?: string) => {
    const res = await getGames(q)
    setGames(res.data)
  }

  useEffect(() => { load() }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    load(search || undefined)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setImage(file)
    setPreview(file ? URL.createObjectURL(file) : null)
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

  const handleDelete = async (id: number) => {
    if (!confirm('削除しますか？')) return
    await deleteGame(id)
    load()
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">ゲーム一覧</h1>
        {loggedIn && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded text-sm"
          >
            + ゲーム追加
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-lg shadow p-4 mb-6 space-y-3">
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <input
            type="text"
            placeholder="ゲーム名"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <textarea
            placeholder="説明"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div>
            <label className="block text-sm text-gray-600 mb-1">画像</label>
            {preview && (
              <img src={preview} alt="preview" className="w-24 h-24 object-cover rounded mb-2 border" />
            )}
            <input type="file" accept="image/*" onChange={handleImageChange} className="text-sm text-gray-600" />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded text-sm">
              保存
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setImage(null); setPreview(null) }}
              className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded text-sm"
            >
              キャンセル
            </button>
          </div>
        </form>
      )}

      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="ゲームを検索..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button type="submit" className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm">
          検索
        </button>
        {search && (
          <button type="button" onClick={() => { setSearch(''); load() }} className="bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded text-sm">
            クリア
          </button>
        )}
      </form>

      {games.length === 0 ? (
        <p className="text-gray-500 text-center py-12">ゲームがありません</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {games.map((game) => (
            <div key={game.id} className="bg-white rounded-lg shadow overflow-hidden flex">
              {game.imagePath ? (
                <img
                  src={`/uploads/${game.imagePath}`}
                  alt={game.name}
                  className="w-24 h-24 object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-24 h-24 bg-gray-100 flex items-center justify-center text-gray-400 text-xs flex-shrink-0">
                  画像なし
                </div>
              )}
              <div className="p-4 flex flex-col gap-1 flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <Link to={`/games/${game.id}`} className="text-lg font-semibold text-indigo-600 hover:underline truncate">
                    {game.name}
                  </Link>
                  {admin && (
                    <button
                      onClick={() => handleDelete(game.id)}
                      className="text-red-400 hover:text-red-600 text-sm ml-2 flex-shrink-0"
                    >
                      削除
                    </button>
                  )}
                </div>
                {game.description && (
                  <p className="text-gray-600 text-sm line-clamp-2">{game.description}</p>
                )}
                <Link
                  to={`/items?gameId=${game.id}`}
                  className="text-xs text-indigo-500 hover:underline mt-auto"
                >
                  アイテムを見る →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
