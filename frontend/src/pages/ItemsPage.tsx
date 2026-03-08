import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getItems, getGames, getTags } from '../api'
import { isLoggedIn } from '../auth'
import type { Item, Game, Tag } from '../types'

export default function ItemsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [items, setItems] = useState<Item[]>([])
  const [games, setGames] = useState<Game[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [gameId, setGameId] = useState<string>(searchParams.get('gameId') || '')
  const [tag, setTag] = useState<string>(searchParams.get('tag') || '')
  const [keyword, setKeyword] = useState<string>(searchParams.get('keyword') || '')
  const loggedIn = isLoggedIn()

  useEffect(() => {
    getGames().then((r) => setGames(r.data))
    getTags().then((r) => setTags(r.data))
  }, [])

  useEffect(() => {
    const params: Record<string, string> = {}
    if (gameId) params.gameId = gameId
    if (tag) params.tag = tag
    if (keyword) params.keyword = keyword
    setSearchParams(params, { replace: true })
    getItems(gameId ? Number(gameId) : undefined, tag || undefined, keyword || undefined)
      .then((r) => setItems(r.data))
  }, [gameId, tag, keyword])

  const clearFilter = () => {
    setGameId('')
    setTag('')
    setKeyword('')
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-100">アイテム一覧</h1>
        {loggedIn && (
          <Link
            to="/items/new"
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded text-sm"
          >
            + アイテム追加
          </Link>
        )}
      </div>

      <div className="bg-gray-800 rounded-lg shadow p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-400 mb-1">ゲームで絞り込み</label>
          <select
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            className="border border-gray-600 rounded px-3 py-2 text-sm bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">すべて</option>
            {games.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">タグで絞り込み</label>
          <select
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="border border-gray-600 rounded px-3 py-2 text-sm bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">すべて</option>
            {tags.map((t) => (
              <option key={t.id} value={t.name}>{t.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">名前・説明文キーワード</label>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="例: ルーン"
            className="border border-gray-600 rounded px-3 py-2 text-sm bg-gray-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        {(gameId || tag || keyword) && (
          <button onClick={clearFilter} className="bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-2 rounded text-sm">
            クリア
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-gray-500 text-center py-12">アイテムがありません</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <Link
              key={item.id}
              to={`/items/${item.id}`}
              className="bg-gray-800 rounded-lg shadow hover:shadow-md transition overflow-hidden"
            >
              {item.imagePath ? (
                <img
                  src={`/uploads/${item.imagePath}`}
                  alt={item.name}
                  className="w-full h-40 object-cover"
                />
              ) : (
                <div className="w-full h-40 bg-gray-700 flex items-center justify-center text-gray-500 text-sm">
                  画像なし
                </div>
              )}
              <div className="p-3">
                <p className="font-semibold text-gray-100">{item.name}</p>
                <p className="text-xs text-indigo-400 mb-1">{item.gameName}</p>
                {item.description && (
                  <p className="text-gray-400 text-xs line-clamp-2">{item.description}</p>
                )}
                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.tags.map((t) => (
                      <span key={t.id} className="bg-indigo-900 text-indigo-300 text-xs px-2 py-0.5 rounded-full">
                        {t.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
