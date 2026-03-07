import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getItem, deleteItem } from '../api'
import { isLoggedIn } from '../auth'
import type { Item } from '../types'

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [item, setItem] = useState<Item | null>(null)
  const loggedIn = isLoggedIn()

  useEffect(() => {
    getItem(Number(id)).then((res) => setItem(res.data))
  }, [id])

  const handleDelete = async () => {
    if (!confirm('このアイテムを削除しますか？')) return
    await deleteItem(Number(id))
    navigate('/items')
  }

  if (!item) return <div className="text-center py-12 text-gray-400">読み込み中...</div>

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link to="/items" className="text-indigo-400 hover:underline text-sm">← アイテム一覧</Link>

      <div className="bg-gray-800 rounded-lg shadow mt-4 overflow-hidden">
        {item.imagePath ? (
          <img
            src={`/uploads/${item.imagePath}`}
            alt={item.name}
            className="w-full max-h-80 object-contain bg-gray-900"
          />
        ) : (
          <div className="w-full h-48 bg-gray-700 flex items-center justify-center text-gray-500">
            画像なし
          </div>
        )}

        <div className="p-6">
          <div className="flex items-start justify-between mb-2">
            <h1 className="text-2xl font-bold text-gray-100">{item.name}</h1>
            {loggedIn && (
              <div className="flex gap-2">
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
    </div>
  )
}
