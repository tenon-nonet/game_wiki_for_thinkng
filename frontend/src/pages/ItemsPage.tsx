import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getItems, getGames, getTags, updateItemOrder } from '../api'
import { isLoggedIn } from '../auth'
import EncyclopediaCard from '../components/EncyclopediaCard'
import type { Game, Item, Tag } from '../types'

export default function ItemsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [items, setItems] = useState<Item[]>([])
  const [games, setGames] = useState<Game[]>([])
  const [tags, setTags] = useState<Tag[]>([])
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
    getItems(gameId ? Number(gameId) : undefined, tag || undefined, keyword || undefined).then((r) => setItems(r.data))
  }, [gameId, tag, keyword])

  const clearFilter = () => {
    setGameId('')
    setTag('')
    setKeyword('')
  }

  return (
    <div className="w-full px-4 py-6 sm:px-8 sm:py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 sm:text-3xl">アイテム図録</h1>
          <p className="mt-1 text-sm text-zinc-500">詳細画面の画像と情報を大きなカードで並べて鑑賞できます。</p>
        </div>
        {loggedIn && (
          <div className="flex gap-2">
            <Link
              to="/items/bulk-import"
              className="rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-gray-200 transition hover:bg-zinc-700"
            >
              一括取り込み
            </Link>
            <Link
              to="/catalog"
              className="rounded bg-red-900 px-3 py-2 text-sm text-white transition hover:bg-red-800"
            >
              目録から登録
            </Link>
          </div>
        )}
      </div>

      <div className="mb-8 flex w-full flex-col flex-wrap gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 shadow-lg sm:flex-row sm:items-end">
        <div>
          <label className="mb-1 block text-xs text-gray-400">ゲームで絞り込み</label>
          <select
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            className="w-full rounded border border-gray-600 bg-zinc-800 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-800 sm:w-auto"
          >
            <option value="">すべて</option>
            {games.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-400">タグで絞り込み</label>
          <select
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="w-full rounded border border-gray-600 bg-zinc-800 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-800 sm:w-auto"
          >
            <option value="">すべて</option>
            {tags.map((t) => (
              <option key={t.id} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-400">名前・説明文キーワード</label>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="例: ルーン"
            className="w-full rounded border border-gray-600 bg-zinc-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-800 sm:w-64"
          />
        </div>
        {(gameId || tag || keyword) && (
          <button onClick={clearFilter} className="rounded bg-zinc-700 px-3 py-2 text-sm text-gray-200 transition hover:bg-gray-600">
            クリア
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="py-12 text-center text-gray-500">アイテムがありません</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {items.map((item, index) => (
            <EncyclopediaCard
              key={item.id}
              to={`/items/${item.id}?from=items`}
              name={item.name}
              gameName={item.gameName}
              imagePath={item.imagePath}
              description={item.description}
              createdAt={item.createdAt}
              updatedAt={item.updatedAt}
              draggable={loggedIn}
              onDragStart={loggedIn ? () => handleDragStart(index) : undefined}
              onDragOver={loggedIn ? (e) => handleDragOver(e, index) : undefined}
              onDrop={loggedIn ? () => handleDrop(index) : undefined}
              onDragEnd={handleDragEnd}
              isDragTarget={dragOverIndex === index && dragIndex !== index}
            />
          ))}
        </div>
      )}
    </div>
  )
}



