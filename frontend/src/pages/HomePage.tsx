import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getGames, getItems } from '../api'
import type { Game, Item } from '../types'

export default function HomePage() {
  const [games, setGames] = useState<Game[]>([])
  const [items, setItems] = useState<Item[]>([])

  useEffect(() => {
    getGames().then((r) => setGames(r.data.slice(0, 6)))
    getItems().then((r) => setItems(r.data.slice(0, 6)))
  }, [])

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">GameWiki</h1>
        <p className="text-gray-500">ゲームのアイテム情報を共有するWikiサイト</p>
      </div>

      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-700">ゲーム一覧</h2>
          <Link to="/games" className="text-indigo-600 hover:underline text-sm">すべて見る →</Link>
        </div>
        {games.length === 0 ? (
          <p className="text-gray-400 text-sm">まだゲームが登録されていません</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {games.map((g) => (
              <Link
                key={g.id}
                to={`/games/${g.id}`}
                className="bg-white rounded-lg shadow hover:shadow-md transition p-4"
              >
                <p className="font-semibold text-gray-800">{g.name}</p>
                {g.description && (
                  <p className="text-gray-500 text-xs mt-1 line-clamp-2">{g.description}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-700">最新アイテム</h2>
          <Link to="/items" className="text-indigo-600 hover:underline text-sm">すべて見る →</Link>
        </div>
        {items.length === 0 ? (
          <p className="text-gray-400 text-sm">まだアイテムが登録されていません</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {items.map((item) => (
              <Link
                key={item.id}
                to={`/items/${item.id}`}
                className="bg-white rounded-lg shadow hover:shadow-md transition overflow-hidden"
              >
                {item.imagePath ? (
                  <img
                    src={`/uploads/${item.imagePath}`}
                    alt={item.name}
                    className="w-full h-32 object-cover"
                  />
                ) : (
                  <div className="w-full h-32 bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                    画像なし
                  </div>
                )}
                <div className="p-3">
                  <p className="font-medium text-gray-800 text-sm">{item.name}</p>
                  <p className="text-xs text-indigo-500">{item.gameName}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
