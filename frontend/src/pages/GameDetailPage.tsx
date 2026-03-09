import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getGame, updateGame, deleteGame } from '../api'
import { isAdmin } from '../auth'
import type { Game } from '../types'

export default function GameDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [game, setGame] = useState<Game | null>(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const admin = isAdmin()

  useEffect(() => {
    getGame(Number(id)).then((res) => {
      setGame(res.data)
      setForm({ name: res.data.name, description: res.data.description || '' })
    })
  }, [id])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setImage(file)
    setPreview(file ? URL.createObjectURL(file) : null)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await updateGame(Number(id), form.name, form.description, image)
    setGame(res.data)
    setEditing(false)
    setImage(null)
    setPreview(null)
  }

  const handleDelete = async () => {
    if (!confirm('このゲームを削除しますか？')) return
    await deleteGame(Number(id))
    navigate('/games')
  }

  if (!game) return <div className="text-center py-12 text-gray-400">読み込み中...</div>

  return (
    <div className="w-full max-w-5xl mx-auto px-8 py-10">
      <Link to="/games" className="text-indigo-400 hover:underline text-sm">← ゲーム一覧</Link>

      <div className="bg-gray-800 rounded-lg shadow mt-4 overflow-hidden">
        {!editing && game.imagePath && (
          <img
            src={`/uploads/${game.imagePath}`}
            alt={game.name}
            className="w-full max-h-96 object-contain bg-gray-900"
          />
        )}

        <div className="p-8">
          {editing ? (
            <form onSubmit={handleUpdate} className="space-y-3">
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full border border-gray-600 rounded px-3 py-2 bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xl font-bold"
              />
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
                className="w-full border border-gray-600 rounded px-3 py-2 bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div>
                <label className="block text-sm text-gray-300 mb-1">画像を変更</label>
                {(preview || game.imagePath) && (
                  <img
                    src={preview || `/uploads/${game.imagePath}`}
                    alt="preview"
                    className="w-24 h-24 object-cover rounded mb-2 border border-gray-600"
                  />
                )}
                <input type="file" accept="image/*" onChange={handleImageChange} className="text-sm text-gray-400" />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded text-sm">
                  保存
                </button>
                <button
                  type="button"
                  onClick={() => { setEditing(false); setImage(null); setPreview(null) }}
                  className="bg-gray-700 hover:bg-gray-600 text-gray-200 px-4 py-2 rounded text-sm"
                >
                  キャンセル
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="flex items-start justify-between mb-3">
                <h1 className="text-2xl font-bold text-gray-100">{game.name}</h1>
                {admin && (
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(true)} className="text-indigo-400 hover:underline text-sm">編集</button>
                    <button onClick={handleDelete} className="text-red-400 hover:underline text-sm">削除</button>
                  </div>
                )}
              </div>
              {game.description && <p className="text-gray-300 mb-4">{game.description}</p>}
              <p className="text-xs text-gray-500">追加日: {new Date(game.createdAt).toLocaleDateString('ja-JP')}</p>
            </>
          )}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-200">このゲームのアイテム</h2>
        <Link to={`/items?gameId=${game.id}`} className="text-indigo-400 hover:underline text-sm">
          アイテム一覧を見る →
        </Link>
      </div>
    </div>
  )
}
