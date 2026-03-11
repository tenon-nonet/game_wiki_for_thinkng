import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getNpcs, getGames, getTags, updateNpcOrder, getCatalogEntries } from '../api'
import { isLoggedIn } from '../auth'
import type { Npc, Game, Tag, CatalogEntry } from '../types'

export default function NpcsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [npcs, setNpcs] = useState<Npc[]>([])
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
    const newNpcs = [...npcs]
    const [moved] = newNpcs.splice(dragIndex, 1)
    newNpcs.splice(index, 0, moved)
    setNpcs(newNpcs)
    setDragIndex(null)
    setDragOverIndex(null)
    await updateNpcOrder(newNpcs.map((n) => n.id))
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
      getTags(Number(gameId), 'NPC').then((r) => setTags(r.data))
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
    getNpcs(gameId ? Number(gameId) : undefined, tag || undefined, keyword || undefined)
      .then((r) => setNpcs(r.data))
    getCatalogEntries(gameId ? Number(gameId) : undefined, 'NPC').then((r) => setCatalogEntries(r.data))
  }, [gameId, tag, keyword])

  const clearFilter = () => {
    setGameId('')
    setTag('')
    setKeyword('')
  }

  const unregisteredEntries = tag
    ? []
    : catalogEntries.filter((e) => {
        const inWiki = npcs.some((n) => n.name.toLowerCase() === e.name.toLowerCase())
        if (inWiki) return false
        if (keyword && !e.name.toLowerCase().includes(keyword.toLowerCase())) return false
        return true
      })

  return (
    <div className="w-full px-4 sm:px-8 py-6 sm:py-10">
      <div className="flex flex-wrap items-center justify-between mb-6 gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-100">NPC一覧</h1>
        {loggedIn && (
          <Link
            to="/catalog"
            className="bg-red-900 hover:bg-red-800 text-white px-3 py-2 rounded text-sm whitespace-nowrap"
          >
            目録から登録
          </Link>
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
            placeholder="例: 白面のヴァレー"
            className="w-full sm:w-auto border border-gray-600 rounded px-3 py-2 text-sm bg-zinc-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-800"
          />
        </div>
        {(gameId || tag || keyword) && (
          <button onClick={clearFilter} className="bg-zinc-700 hover:bg-gray-600 text-gray-200 px-3 py-2 rounded text-sm">
            クリア
          </button>
        )}
      </div>

      {npcs.length === 0 && unregisteredEntries.length === 0 ? (
        <p className="text-gray-500 text-center py-12">NPCが登録されていません</p>
      ) : (
        <div className="grid grid-cols-4 gap-3">
          {npcs.map((npc, index) => (
            <div
              key={npc.id}
              draggable={loggedIn}
              onDragStart={() => loggedIn && handleDragStart(index)}
              onDragOver={(e) => loggedIn && handleDragOver(e, index)}
              onDrop={() => loggedIn && handleDrop(index)}
              onDragEnd={handleDragEnd}
              className={`group bg-zinc-800 rounded-xl shadow overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${loggedIn ? 'cursor-grab active:cursor-grabbing' : ''} ${dragOverIndex === index && dragIndex !== index ? 'ring-2 ring-red-700 opacity-75' : ''}`}
            >
              <Link to={`/npcs/${npc.id}`} className="block">
                <div className="overflow-hidden">
                  {npc.imagePath ? (
                    <img
                      src={`/uploads/${npc.imagePath}`}
                      alt={npc.name}
                      className="w-full h-48 object-contain bg-zinc-900 transition-transform duration-500 ease-out group-hover:scale-125"
                    />
                  ) : (
                    <div className="w-full h-48 bg-zinc-700 flex items-center justify-center text-gray-500 text-xs">
                      画像なし
                    </div>
                  )}
                </div>
                <div className="p-3 flex flex-col gap-1">
                  <p className="text-xs text-gray-400">{npc.gameName}</p>
                  <p className="font-semibold text-gray-100 text-sm line-clamp-2">{npc.name}</p>
                  {npc.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {npc.tags.map((t) => (
                        <span key={t.id} className="bg-red-950 text-white text-xs px-2 py-0.5 rounded-full">
                          {t.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            </div>
          ))}
          {unregisteredEntries.map((entry) => (
            <div key={`catalog-${entry.id}`} className="bg-zinc-900 border border-zinc-700 rounded-xl shadow overflow-hidden opacity-60">
              {loggedIn ? (
                <Link to={`/npcs/new?name=${encodeURIComponent(entry.name)}&gameId=${entry.gameId}`} className="block h-full">
                  <div className="w-full h-48 bg-zinc-800 flex items-center justify-center text-zinc-600 text-xs">未登録</div>
                  <div className="p-3 flex flex-col gap-1">
                    <p className="font-semibold text-gray-300 text-sm line-clamp-2">{entry.name}</p>
                    <p className="text-zinc-500 text-xs">クリックして登録</p>
                  </div>
                </Link>
              ) : (
                <div>
                  <div className="w-full h-48 bg-zinc-800 flex items-center justify-center text-zinc-600 text-xs">未登録</div>
                  <div className="p-3"><p className="font-semibold text-gray-300 text-sm line-clamp-2">{entry.name}</p></div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
