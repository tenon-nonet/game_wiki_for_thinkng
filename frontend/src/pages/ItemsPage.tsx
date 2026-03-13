import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getItems, getGames, getTags, updateItemOrder, getCatalogEntries } from '../api'
import { isLoggedIn } from '../auth'
import type { Item, Game, Tag, CatalogEntry } from '../types'

export default function ItemsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [items, setItems] = useState<Item[]>([])
  const [games, setGames] = useState<Game[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [catalogEntries, setCatalogEntries] = useState<CatalogEntry[]>([])
  const [gameId, setGameId] = useState<string>(searchParams.get('gameId') || '')
  const [tag, setTag] = useState<string>(searchParams.get('tag') || '')
  const [keyword, setKeyword] = useState<string>(searchParams.get('keyword') || '')
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const loggedIn = isLoggedIn()

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
    const newItems = [...items]
    const [moved] = newItems.splice(dragIndex, 1)
    newItems.splice(index, 0, moved)
    setItems(newItems)
    setDragIndex(null)
    setDragOverIndex(null)
    await updateItemOrder(newItems.map((i) => i.id))
  }

  const handleDragEnd = () => {
    setDragIndex(null)
    setDragOverIndex(null)
  }

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
    getCatalogEntries(gameId ? Number(gameId) : undefined, 'ITEM').then((r) => setCatalogEntries(r.data))
  }, [gameId, tag, keyword])

  const clearFilter = () => {
    setGameId('')
    setTag('')
    setKeyword('')
  }

  const isItemRegistered = (item: Item | undefined) =>
    !!item && !!item.imagePath && !!item.description?.trim()

  // カタログ登録済みだがwiki未登録のエントリ（タグフィルターなし時のみ表示）
  const unregisteredEntries = tag
    ? []
    : catalogEntries.filter((e) => {
        const matchedItem = items.find(
          (i) => i.gameId === e.gameId && normalizeName(i.name) === normalizeName(e.name)
        )
        if (isItemRegistered(matchedItem)) return false
        if (keyword && !normalizeName(e.name).includes(normalizeName(keyword))) return false
        return true
      })

  return (
    <div className="w-full px-4 sm:px-8 py-6 sm:py-10">
      <div className="flex flex-wrap items-center justify-between mb-6 gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-100">アイテム一覧</h1>
        {loggedIn && (
          <div className="flex gap-2 flex-shrink-0">
            <Link
              to="/items/bulk-import"
              className="bg-zinc-700 hover:bg-gray-600 text-gray-200 px-3 py-2 rounded text-sm whitespace-nowrap"
            >
              一括取り込み
            </Link>
            <Link
              to="/catalog"
              className="bg-red-900 hover:bg-red-800 text-white px-3 py-2 rounded text-sm whitespace-nowrap"
            >
              目録から登録
            </Link>
          </div>
        )}
      </div>

      <div className="bg-zinc-800 rounded-lg shadow p-4 mb-6 flex flex-col sm:flex-row flex-wrap gap-3 items-start sm:items-end w-full sm:w-fit">
        <div>
          <label className="block text-xs text-gray-400 mb-1">ゲームで絞り込み</label>
          <select
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            className="w-full sm:w-auto border border-gray-600 rounded px-3 py-2 text-sm bg-zinc-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-800"
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
            className="w-full sm:w-auto border border-gray-600 rounded px-3 py-2 text-sm bg-zinc-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-800"
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
            className="w-full sm:w-auto border border-gray-600 rounded px-3 py-2 text-sm bg-zinc-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-800"
          />
        </div>
        {(gameId || tag || keyword) && (
          <button onClick={clearFilter} className="bg-zinc-700 hover:bg-gray-600 text-gray-200 px-3 py-2 rounded text-sm">
            クリア
          </button>
        )}
      </div>

      {items.length === 0 && unregisteredEntries.length === 0 ? (
        <p className="text-gray-500 text-center py-12">アイテムがありません</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {items.map((item, index) => (
            <div
              key={item.id}
              draggable={loggedIn}
              onDragStart={() => loggedIn && handleDragStart(index)}
              onDragOver={(e) => loggedIn && handleDragOver(e, index)}
              onDrop={() => loggedIn && handleDrop(index)}
              onDragEnd={handleDragEnd}
              className={`group relative bg-zinc-800 rounded-lg shadow hover:shadow-md transition overflow-hidden ${loggedIn ? 'cursor-grab active:cursor-grabbing' : ''} ${dragOverIndex === index && dragIndex !== index ? 'ring-2 ring-red-700 opacity-75' : ''}`}
            >
              <Link to={`/items/${item.id}`} className="flex items-stretch">
                {item.imagePath ? (
                  <img
                    src={`/uploads/${item.imagePath}`}
                    alt={item.name}
                    className="w-24 h-24 sm:w-36 sm:h-36 object-contain bg-zinc-900 flex-shrink-0"
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-36 sm:h-36 bg-zinc-700 flex items-center justify-center text-gray-500 text-xs flex-shrink-0">
                    画像なし
                  </div>
                )}
                <div className="p-3 sm:p-4 flex flex-col justify-center min-w-0">
                  <p className="text-xs sm:text-sm text-gray-400 mb-0.5">{item.gameName}</p>
                  <p className="font-semibold text-gray-100 text-sm sm:text-base line-clamp-2 mb-1">{item.name}</p>
                  {item.description && (
                    <p className="text-gray-400 text-xs line-clamp-2 sm:line-clamp-3">{item.description}</p>
                  )}
                  {item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.tags.map((t) => (
                        <span key={t.id} className="bg-red-950 text-white text-xs px-2 py-0.5 rounded-full">
                          {t.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
              {item.description && (
                <div className="absolute inset-0 bg-zinc-900/92 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-center p-4 pointer-events-none">
                  <p className="text-gray-100 font-semibold text-sm mb-2">{item.name}</p>
                  <p className="text-gray-300 text-xs leading-relaxed line-clamp-[8]">{item.description}</p>
                </div>
              )}
            </div>
          ))}
          {unregisteredEntries.map((entry) => (
            <div key={`catalog-${entry.id}`} className="bg-zinc-900 border border-zinc-700 rounded-lg shadow overflow-hidden opacity-60">
              {(() => {
                const matchedItem = items.find(
                  (item) => item.gameId === entry.gameId && normalizeName(item.name) === normalizeName(entry.name)
                )
                const continuePath = matchedItem
                  ? `/items/${matchedItem.id}/edit?from=catalog&gameId=${entry.gameId}&tab=ITEM`
                  : `/items/new?name=${encodeURIComponent(entry.name)}&gameId=${entry.gameId}${entry.category ? `&category=${encodeURIComponent(entry.category)}` : ''}`
                const cta = matchedItem ? 'クリックして続きを入力' : 'クリックして登録'
                return loggedIn ? (
                  <Link to={continuePath} className="flex items-stretch h-full">
                    <div className="w-24 h-24 sm:w-36 sm:h-36 bg-zinc-800 flex items-center justify-center text-zinc-600 text-xs flex-shrink-0">
                      未登録
                    </div>
                    <div className="p-3 sm:p-4 flex flex-col justify-center min-w-0">
                      <p className="font-semibold text-gray-300 text-sm sm:text-base line-clamp-2 mb-1">{entry.name}</p>
                      {entry.category && <p className="text-zinc-500 text-xs">{entry.category}</p>}
                      <p className="text-zinc-500 text-xs mt-1">{cta}</p>
                    </div>
                  </Link>
                ) : (
                  <div className="flex items-stretch">
                    <div className="w-24 h-24 sm:w-36 sm:h-36 bg-zinc-800 flex items-center justify-center text-zinc-600 text-xs flex-shrink-0">
                      未登録
                    </div>
                    <div className="p-3 sm:p-4 flex flex-col justify-center min-w-0">
                      <p className="font-semibold text-gray-300 text-sm sm:text-base line-clamp-2 mb-1">{entry.name}</p>
                      {entry.category && <p className="text-zinc-500 text-xs">{entry.category}</p>}
                    </div>
                  </div>
                )
              })()}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
  const normalizeName = (name: string) => name.trim().toLowerCase()
