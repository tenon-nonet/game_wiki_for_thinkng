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
import CatalogControls from '../components/catalog/CatalogControls'
import CatalogEntryCard from '../components/catalog/CatalogEntryCard'
import CatalogEntryGrid from '../components/catalog/CatalogEntryGrid'
import CatalogProgressBar from '../components/catalog/CatalogProgressBar'
import type { Boss, CatalogEntry, Game, Item, Npc } from '../types'
import {
  filterEntries,
  findWikiEntity,
  getEntryStatus,
  groupEntriesByGame,
  groupItemsByCategory,
  groupItemsByGameAndCategory,
  type TabType,
  VALID_TABS,
} from './catalogUtils'

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

  const wikiPath = (tab: TabType) => {
    if (tab === 'ITEM') return 'items'
    if (tab === 'BOSS') return 'bosses'
    return 'npcs'
  }

  const progress = (tab: TabType) => {
    const all = entriesForTab(tab)
    const registered = all.filter((entry) => getEntryStatus(entry, tab, items, bosses, npcs) === 'REGISTERED').length
    return { registered, total: all.length }
  }

  const progressByTab = {
    ITEM: progress('ITEM'),
    BOSS: progress('BOSS'),
    NPC: progress('NPC'),
  } as const

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

  const currentEntries = filterEntries(entriesForTab(activeTab), keyword)
  const { registered, total } = progress(activeTab)
  const isAllGames = selectedGameId === 0
  const selectedGame = games.find((game) => game.id === selectedGameId) ?? null
  const gameCategories = selectedGame?.categories ?? []

  const groupedItemEntries = (() => {
    if (activeTab !== 'ITEM' || isAllGames) return null
    return groupItemsByCategory(currentEntries, gameCategories)
  })()

  const groupedItemByGameAndCategory = (() => {
    if (!isAllGames || activeTab !== 'ITEM') return null

    return groupItemsByGameAndCategory(currentEntries, games)
  })()

  const groupedByGame = (() => {
    if (!isAllGames) return null

    return groupEntriesByGame(currentEntries, games)
  })()

  const renderCard = (entry: CatalogEntry, tab: TabType) => {
    const wiki = findWikiEntity(entry, tab, items, bosses, npcs)
    const status = getEntryStatus(entry, tab, items, bosses, npcs)
    const cardPath = `/${wikiPath(tab)}/${entry.id}?from=catalog${selectedGameId > 0 ? `&gameId=${selectedGameId}` : ''}&tab=${tab}`

    return (
      <CatalogEntryCard
        key={`${entry.type}-${entry.id}`}
        entry={entry}
        tab={tab}
        status={status}
        imagePath={wiki?.imagePath}
        onOpen={() => navigate(cardPath)}
        onDelete={isAdmin() ? () => handleDelete(entry.id, entry.type as TabType) : undefined}
      />
    )
  }

  return (
    <div className="w-full px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-100">目録</h1>

      <CatalogControls
        games={games}
        selectedGameId={selectedGameId}
        activeTab={activeTab}
        keyword={keyword}
        newName={newName}
        newCategory={newCategory}
        gameCategories={gameCategories}
        adding={adding}
        addError={addError}
        onGameChange={(gameId) => {
          setSelectedGameId(gameId)
          setKeyword('')
        }}
        onKeywordChange={setKeyword}
        onTabChange={(tab) => {
          setActiveTab(tab)
          setAddError('')
        }}
        onNewNameChange={setNewName}
        onNewCategoryChange={setNewCategory}
        onAdd={handleAdd}
        progressByTab={progressByTab}
      />

      <CatalogProgressBar registered={registered} total={total} />

      {isAdmin() && selectedGameId > 0 && (
        <div className="mb-5 flex flex-wrap items-start justify-end gap-2">
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

      <CatalogEntryGrid
        activeTab={activeTab}
        total={total}
        currentEntries={currentEntries}
        groupedItemEntries={groupedItemEntries}
        groupedItemByGameAndCategory={groupedItemByGameAndCategory}
        groupedByGame={groupedByGame}
        renderCard={renderCard}
      />
    </div>
  )
}
