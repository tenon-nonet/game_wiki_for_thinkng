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
  }, [])

  useEffect(() => {
    if (gameId) {
      getTags(Number(gameId)).then((r) => setTags(r.data))
    } else {
      setTags([])
      setTag('')
    }
  }, [gameId])

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
    <div className="w-full px-4 sm:px-8 py-6 sm:py-10">
      <div className="flex flex-wrap items-center justify-between mb-6 gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-100">アイテム一覧</h1>
        {loggedIn && (
          <div className="flex gap-2 flex-shrink-0">
            <Link
              to="/items/bulk-import"
              className="bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-2 rounded text-sm whitespace-nowrap"
            >
              一括取り込み
            </Link>
            <Link
              to="/items/new"
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded text-sm whitespace-nowrap"
            >
              + アイテム追加
            </Link>
          </div>
        )}
      </div>

      <div className="bg-gray-800 rounded-lg shadow p-4 mb-6 flex flex-col sm:flex-row flex-wrap gap-3 items-start sm:items-end w-full sm:w-fit">
        <div>
          <label className="block text-xs text-gray-400 mb-1">ゲームで絞り込み</label>
          <select
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            className="w-full sm:w-auto border border-gray-600 rounded px-3 py-2 text-sm bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            className="w-full sm:w-auto border border-gray-600 rounded px-3 py-2 text-sm bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            className="w-full sm:w-auto border border-gray-600 rounded px-3 py-2 text-sm bg-gray-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
          {items.map((item) => (
            <Link
              key={item.id}
              to={`/items/${item.id}`}
              className="group relative bg-gray-800 rounded-lg shadow hover:shadow-md transition overflow-hidden"
            >
              {item.imagePath ? (
                <img
                  src={`/uploads/${item.imagePath}`}
                  alt={item.name}
                  className="w-full h-52 object-contain bg-gray-900"
                />
              ) : (
                <div className="w-full h-52 bg-gray-700 flex items-center justify-center text-gray-500 text-sm">
                  画像なし
                </div>
              )}
              <div className="p-4">
                <p className="font-semibold text-gray-100 text-base">{item.name}</p>
                <p className="text-sm text-indigo-400 mb-1">{item.gameName}</p>
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
              {item.description && (
                <div className="absolute inset-0 bg-gray-900/90 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-center p-4 pointer-events-none">
                  <p className="text-gray-100 font-semibold text-sm mb-2">{item.name}</p>
                  <p className="text-gray-300 text-xs leading-relaxed line-clamp-[10]">{item.description}</p>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
