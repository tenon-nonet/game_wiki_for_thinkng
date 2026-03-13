import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  bulkCreateCatalogEntries,
  createCatalogEntry,
  deleteCatalogEntry,
  getBosses,
  getCatalogEntries,
  getGames,
  getItems,
  getNpcs,
} from '../api'
import { isAdmin } from '../auth'
import type { Boss, CatalogEntry, Game, Item, Npc } from '../types'

type TabType = 'ITEM' | 'BOSS' | 'NPC'
type EntryStatus = 'REGISTERED' | 'IN_PROGRESS' | 'UNREGISTERED'

type WikiEntity = Item | Boss | Npc

const TAB_CONFIG: { key: TabType; label: string }[] = [
  { key: 'ITEM', label: 'アイテム' },
  { key: 'BOSS', label: 'ボス' },
  { key: 'NPC', label: 'NPC' },
]

const VALID_TABS: TabType[] = ['ITEM', 'BOSS', 'NPC']
const UNCATEGORIZED_LABEL = '未分類'

export default function CatalogPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [games, setGames] = useState<Game[]>([])
  const [selectedGameId, setSelectedGameId] = useState<number>(Number(searchParams.get('gameId')) || 0)
  const [activeTab, setActiveTab] = useState<TabType>(
    VALID_TABS.includes(searchParams.get('tab') as TabType) ? (searchParams.get('tab') as TabType) : 'ITEM'
  )
  const [items, setItems] = useState<Item[]>([])
  const [bosses, setBosses] = useState<Boss[]>([])
  const [npcs, setNpcs] = useState<Npc[]>([])
  const [catalogEntries, setCatalogEntries] = useState<CatalogEntry[]>([])
  const [keyword, setKeyword] = useState('')
  const [newName, setNewName] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [addError, setAddError] = useState('')
  const [adding, setAdding] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkText, setBulkText] = useState('')
  const [bulkCategory, setBulkCategory] = useState('')
  const [bulkResult, setBulkResult] = useState<{ added: number; skipped: number } | null>(null)
  const [bulking, setBulking] = useState(false)

  useEffect(() => {
    getGames().then((r) => setGames(r.data))
  }, [])

  useEffect(() => {
    const params: Record<string, string> = {}
    if (selectedGameId > 0) params.gameId = String(selectedGameId)
    if (activeTab !== 'ITEM') params.tab = activeTab
    setSearchParams(params, { replace: true })
  }, [activeTab, selectedGameId, setSearchParams])

  useEffect(() => {
    const gameId = selectedGameId > 0 ? selectedGameId : undefined
    getItems(gameId).then((r) => setItems(r.data))
    getBosses(gameId).then((r) => setBosses(r.data))
    getNpcs(gameId).then((r) => setNpcs(r.data))
    getCatalogEntries(gameId).then((r) => setCatalogEntries(r.data))
    setKeyword('')
  }, [selectedGameId])

  const loadWikiEntries = (type?: TabType) => {
    const gameId = selectedGameId > 0 ? selectedGameId : undefined
    if (!type || type === 'ITEM') getItems(gameId).then((r) => setItems(r.data))
    if (!type || type === 'BOSS') getBosses(gameId).then((r) => setBosses(r.data))
    if (!type || type === 'NPC') getNpcs(gameId).then((r) => setNpcs(r.data))
  }

  const loadCatalog = () => {
    const gameId = selectedGameId > 0 ? selectedGameId : undefined
    getCatalogEntries(gameId).then((r) => setCatalogEntries(r.data))
  }

  const entriesForTab = (tab: TabType) => catalogEntries.filter((entry) => entry.type === tab)

  const findWiki = (entry: CatalogEntry, tab: TabType): WikiEntity | undefined => {
    if (tab === 'ITEM') return items.find((item) => item.id === entry.id)
    if (tab === 'BOSS') return bosses.find((boss) => boss.id === entry.id)
    return npcs.find((npc) => npc.id === entry.id)
  }

  const getEntryStatus = (entry: CatalogEntry, tab: TabType): EntryStatus => {
    const wiki = findWiki(entry, tab)
    if (!wiki) return 'UNREGISTERED'

    const hasImage = Boolean(wiki.imagePath)
    const hasDescription = Boolean(wiki.description?.trim())
    const hasTags = Boolean(wiki.tags?.length)

    if (hasImage && hasDescription) return 'REGISTERED'
    if (!hasImage && !hasDescription && !hasTags) return 'UNREGISTERED'
    return 'IN_PROGRESS'
  }

  const wikiPath = (tab: TabType) => {
    if (tab === 'ITEM') return 'items'
    if (tab === 'BOSS') return 'bosses'
    return 'npcs'
  }

  const filteredEntries = (tab: TabType) => {
    const list = entriesForTab(tab)
    if (!keyword.trim()) return list
    const lower = keyword.toLowerCase()
    return list.filter((entry) => entry.name.toLowerCase().includes(lower))
  }

  const progress = (tab: TabType) => {
    const all = entriesForTab(tab)
    const registered = all.filter((entry) => getEntryStatus(entry, tab) === 'REGISTERED').length
    return { registered, total: all.length }
  }

  const handleAdd = async () => {
    if (!isAdmin()) {
      setAddError('目録追加は管理者のみ実行できます')
      return
    }
    if (!newName.trim() || selectedGameId <= 0) return

    setAddError('')
    setAdding(true)
    try {
      await createCatalogEntry({
        name: newName.trim(),
        type: activeTab,
        gameId: selectedGameId,
        category: activeTab === 'ITEM' && newCategory ? newCategory : undefined,
      })
      setNewName('')
      loadCatalog()
      loadWikiEntries(activeTab)
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } }
      setAddError(err.response?.data?.error ?? '目録追加に失敗しました')
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (id: number, type: TabType) => {
    if (!confirm('この目録データを削除しますか？')) return
    try {
      await deleteCatalogEntry(id, type)
      setCatalogEntries((prev) => prev.filter((entry) => !(entry.id === id && entry.type === type)))
      loadWikiEntries(type)
    } catch {
      alert('削除に失敗しました')
    }
  }

  const handleBulk = async () => {
    if (!isAdmin() || selectedGameId <= 0) return
    const names = bulkText.split('\n').map((line) => line.trim()).filter(Boolean)
    if (names.length === 0) return

    setBulking(true)
    setBulkResult(null)
    try {
      const response = await bulkCreateCatalogEntries({
        names,
        type: activeTab,
        gameId: selectedGameId,
        category: activeTab === 'ITEM' && bulkCategory ? bulkCategory : undefined,
      })
      setBulkResult(response.data)
      setBulkText('')
      loadCatalog()
      loadWikiEntries(activeTab)
    } catch {
      alert('一括追加に失敗しました')
    } finally {
      setBulking(false)
    }
  }

  const currentEntries = filteredEntries(activeTab)
  const { registered, total } = progress(activeTab)
  const pct = total === 0 ? 0 : Math.round((registered / total) * 100)
  const isAllGames = selectedGameId === 0
  const selectedGame = games.find((game) => game.id === selectedGameId) ?? null
  const gameCategories = selectedGame?.categories ?? []

  const groupedItemEntries = (() => {
    if (activeTab !== 'ITEM' || isAllGames) return null
    const map = new Map<string, CatalogEntry[]>()
    for (const entry of currentEntries) {
      const key = entry.category || UNCATEGORIZED_LABEL
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(entry)
    }

    const groups: { label: string; entries: CatalogEntry[] }[] = []
    const categoryOrder = [...gameCategories, UNCATEGORIZED_LABEL]
    for (const category of categoryOrder) {
      const entries = map.get(category)
      if (entries?.length) groups.push({ label: category, entries })
    }
    for (const [category, entries] of map.entries()) {
      if (!categoryOrder.includes(category)) groups.push({ label: category, entries })
    }
    return groups
  })()

  const groupedItemByGameAndCategory = (() => {
    if (!isAllGames || activeTab !== 'ITEM') return null

    const gameMap = new Map<string, Map<string, CatalogEntry[]>>()
    for (const entry of currentEntries) {
      const gameName = entry.gameName
      const category = entry.category || UNCATEGORIZED_LABEL
      if (!gameMap.has(gameName)) gameMap.set(gameName, new Map())
      const categoryMap = gameMap.get(gameName)!
      if (!categoryMap.has(category)) categoryMap.set(category, [])
      categoryMap.get(category)!.push(entry)
    }

    const gameOrderMap = new Map(games.map((game, index) => [game.name, index]))
    return Array.from(gameMap.entries())
      .sort(([a], [b]) => {
        const ai = gameOrderMap.get(a)
        const bi = gameOrderMap.get(b)
        if (ai !== undefined && bi !== undefined) return ai - bi
        if (ai !== undefined) return -1
        if (bi !== undefined) return 1
        return a.localeCompare(b, 'ja')
      })
      .map(([gameName, categoryMap]) => {
        const game = games.find((candidate) => candidate.name === gameName)
        const orderedCategories = game?.categories ? [...game.categories, UNCATEGORIZED_LABEL] : [UNCATEGORIZED_LABEL]
        const categories: { label: string; entries: CatalogEntry[] }[] = []
        for (const category of orderedCategories) {
          const entries = categoryMap.get(category)
          if (entries?.length) categories.push({ label: category, entries })
        }
        for (const [category, entries] of categoryMap.entries()) {
          if (!orderedCategories.includes(category)) categories.push({ label: category, entries })
        }
        return { gameName, categories }
      })
  })()

  const groupedByGame = (() => {
    if (!isAllGames) return null

    const map = new Map<string, CatalogEntry[]>()
    for (const entry of currentEntries) {
      if (!map.has(entry.gameName)) map.set(entry.gameName, [])
      map.get(entry.gameName)!.push(entry)
    }

    const gameOrderMap = new Map(games.map((game, index) => [game.name, index]))
    return Array.from(map.entries())
      .sort(([a], [b]) => {
        const ai = gameOrderMap.get(a)
        const bi = gameOrderMap.get(b)
        if (ai !== undefined && bi !== undefined) return ai - bi
        if (ai !== undefined) return -1
        if (bi !== undefined) return 1
        return a.localeCompare(b, 'ja')
      })
      .map(([gameName, entries]) => ({ gameName, entries }))
  })()

  const renderCard = (entry: CatalogEntry, tab: TabType) => {
    const wiki = findWiki(entry, tab)
    const status = getEntryStatus(entry, tab)
    const hasImage = Boolean(wiki?.imagePath)
    const cardPath = `/${wikiPath(tab)}/${entry.id}?from=catalog${selectedGameId > 0 ? `&gameId=${selectedGameId}` : ''}&tab=${tab}`

    return (
      <div
        key={`${entry.type}-${entry.id}`}
        className="relative flex cursor-pointer flex-col gap-1 overflow-hidden rounded border border-zinc-700 bg-zinc-900 transition hover:border-red-800"
        onClick={() => navigate(cardPath)}
      >
        {hasImage ? (
          <img
            src={`/uploads/${wiki!.imagePath}`}
            alt={entry.name}
            className="h-16 w-full object-cover object-top"
          />
        ) : (
          <div className="flex h-16 w-full items-center justify-center bg-zinc-800 text-xs text-zinc-600">
            画像なし
          </div>
        )}
        <div className="flex flex-col gap-1 px-2.5 py-2">
          <span className="break-all text-xs leading-tight text-gray-100">{entry.name}</span>
          <div className="flex items-center gap-2">
            {status === 'REGISTERED' ? (
              <span className="text-xs text-green-400">図録登録</span>
            ) : status === 'IN_PROGRESS' ? (
              <span className="text-xs text-amber-400">情報不足</span>
            ) : (
              <span className="text-xs text-zinc-500">情報なし</span>
            )}
            {isAdmin() && (
              <button
                onClick={(event) => {
                  event.stopPropagation()
                  handleDelete(entry.id, entry.type as TabType)
                }}
                className="ml-auto rounded border border-red-500/40 px-1.5 py-0.5 text-xs text-red-400/90 transition hover:border-red-400/70 hover:text-red-300"
                title="削除"
              >
                削除
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-100">目録</h1>

      <div className="mb-6 flex flex-wrap items-stretch gap-3 sm:items-center">
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <select
            value={selectedGameId}
            onChange={(event) => {
              setSelectedGameId(Number(event.target.value))
              setKeyword('')
            }}
            className="w-full rounded border border-gray-600 bg-zinc-800 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-800 sm:w-auto"
          >
            <option value={0}>すべて</option>
            {games.map((game) => (
              <option key={game.id} value={game.id}>
                {game.name}
              </option>
            ))}
          </select>
        </div>

        <input
          type="text"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder={activeTab === 'ITEM' ? 'アイテム名で絞り込み...' : activeTab === 'BOSS' ? 'ボス名で絞り込み...' : 'NPC名で絞り込み...'}
          className="w-full rounded border border-gray-600 bg-zinc-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-800 sm:w-56"
        />

        <div className="flex w-full flex-wrap gap-1 rounded-lg bg-zinc-900 p-1 sm:w-auto">
          {TAB_CONFIG.map((tab) => {
            const { registered: tabRegistered, total: tabTotal } = progress(tab.key)
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key)
                  setAddError('')
                }}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  activeTab === tab.key ? 'bg-red-900 text-white' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {tab.label}
                <span className={`ml-2 text-xs ${activeTab === tab.key ? 'text-red-200' : 'text-gray-600'}`}>
                  {tabRegistered}/{tabTotal}
                </span>
              </button>
            )
          })}
        </div>

        {isAdmin() && selectedGameId > 0 && (
          <div className="ml-0 flex w-full flex-wrap items-center gap-1.5 sm:ml-4 sm:w-auto">
            <span className="mr-1 text-sm text-gray-400">目録追加</span>
            {activeTab === 'ITEM' && (
              <select
                value={newCategory}
                onChange={(event) => setNewCategory(event.target.value)}
                className="w-full rounded border border-gray-600 bg-zinc-800 px-2 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-800 sm:w-auto"
              >
                <option value="">カテゴリ</option>
                {gameCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            )}
            <input
              type="text"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleAdd()
              }}
              placeholder="名前を追加..."
              className="w-full rounded border border-gray-600 bg-zinc-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-800 sm:w-56"
            />
            <button
              onClick={handleAdd}
              disabled={adding || !newName.trim()}
              className="rounded bg-red-900 px-3 py-2 text-sm text-white transition hover:bg-red-800 disabled:opacity-50"
            >
              追加
            </button>
            {addError && <span className="text-xs text-red-400">{addError}</span>}
          </div>
        )}
      </div>

      <div className="mb-5 w-full">
        <div className="mb-1 flex justify-between text-xs text-gray-500">
          <span>図録登録済み {registered} / {total}</span>
          <span>{pct}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-zinc-800">
          <div className="h-1.5 rounded-full bg-red-800 transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {isAdmin() && selectedGameId > 0 && (
        <div className="mb-5 flex flex-wrap items-start gap-2">
          <div className="relative">
            <button
              onClick={() => {
                setBulkOpen(!bulkOpen)
                setBulkResult(null)
              }}
              className="rounded border border-zinc-600 px-3 py-1.5 text-xs text-gray-400 transition hover:border-zinc-400 hover:text-gray-200"
            >
              {bulkOpen ? '−' : '+'} 一括目録追加
            </button>
            {bulkOpen && (
              <div className="absolute right-0 top-full z-10 mt-1 w-[min(18rem,calc(100vw-2rem))] space-y-2 rounded-lg border border-zinc-700 bg-zinc-900 p-3 shadow-lg">
                {activeTab === 'ITEM' && (
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 text-xs text-gray-500">カテゴリ</span>
                    <select
                      value={bulkCategory}
                      onChange={(event) => setBulkCategory(event.target.value)}
                      className="flex-1 rounded border border-gray-600 bg-zinc-800 px-2 py-1 text-xs text-gray-100 focus:outline-none focus:ring-1 focus:ring-red-800"
                    >
                      <option value="">未分類</option>
                      {gameCategories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <textarea
                  value={bulkText}
                  onChange={(event) => setBulkText(event.target.value)}
                  rows={5}
                  placeholder={'名前1\n名前2\n名前3\n...'}
                  className="w-full rounded border border-gray-600 bg-zinc-800 px-2 py-1.5 font-mono text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-800"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBulk}
                    disabled={bulking || !bulkText.trim()}
                    className="rounded bg-red-900 px-3 py-1 text-xs text-white transition hover:bg-red-800 disabled:opacity-50"
                  >
                    {bulking ? '追加中...' : '一括追加'}
                  </button>
                  {bulkResult && (
                    <span className="text-xs text-green-400">
                      {bulkResult.added}件追加・{bulkResult.skipped}件スキップ
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {isAllGames && activeTab === 'ITEM' && groupedItemByGameAndCategory ? (
        <div className="space-y-8">
          {groupedItemByGameAndCategory.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">目録データがありません</p>
          ) : (
            groupedItemByGameAndCategory.map(({ gameName, categories }) => (
              <div key={gameName}>
                <h2 className="mb-3 border-b border-zinc-700 px-1 pb-1 text-sm font-semibold text-gray-300">{gameName}</h2>
                <div className="space-y-4">
                  {categories.map((category) => (
                    <div key={category.label}>
                      <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        {category.label}
                        <span className="ml-2 text-zinc-600 normal-case font-normal">{category.entries.length}件</span>
                      </h3>
                      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-10">
                        {category.entries.map((entry) => renderCard(entry, 'ITEM'))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      ) : activeTab === 'ITEM' && groupedItemEntries ? (
        <div className="space-y-6">
          {groupedItemEntries.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              {total === 0 ? '目録データがありません' : '該当するデータがありません'}
            </p>
          ) : (
            groupedItemEntries.map((group) => (
              <div key={group.label}>
                <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {group.label}
                  <span className="ml-2 text-zinc-600 normal-case font-normal">{group.entries.length}件</span>
                </h2>
                <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-10">
                  {group.entries.map((entry) => renderCard(entry, 'ITEM'))}
                </div>
              </div>
            ))
          )}
        </div>
      ) : isAllGames && groupedByGame ? (
        <div className="space-y-8">
          {groupedByGame.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">目録データがありません</p>
          ) : (
            groupedByGame.map(({ gameName, entries }) => (
              <div key={gameName}>
                <h2 className="mb-3 border-b border-zinc-700 px-1 pb-1 text-sm font-semibold text-gray-300">
                  {gameName}
                  <span className="ml-2 text-xs font-normal text-zinc-500">{entries.length}件</span>
                </h2>
                <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-10">
                  {entries.map((entry) => renderCard(entry, activeTab))}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div>
          {currentEntries.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              {total === 0 ? '目録データがありません' : '該当するデータがありません'}
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-10">
              {currentEntries.map((entry) => renderCard(entry, activeTab))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
