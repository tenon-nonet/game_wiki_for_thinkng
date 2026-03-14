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
import { usePageMeta } from '../seo'
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
  usePageMeta({
    title: '目録 | FROMDEX.com',
    description: 'ゲーム内データを整理するための目録ページ。カード表示と目次表示を切り替えて確認できます。',
  })

  const [viewMode, setViewMode] = useState<'card' | 'list'>(() => {
    const saved = localStorage.getItem('catalog_view_mode')
    return saved === 'list' ? 'list' : 'card'
  })
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
    localStorage.setItem('catalog_view_mode', viewMode)
  }, [viewMode])

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

  const renderListRow = (entry: CatalogEntry, tab: TabType) => {
    const status = getEntryStatus(entry, tab, items, bosses, npcs)
    const rowPath = `/${wikiPath(tab)}/${entry.id}?from=catalog${selectedGameId > 0 ? `&gameId=${selectedGameId}` : ''}&tab=${tab}`
    const markerClass =
      status === 'REGISTERED' ? 'bg-green-400' : status === 'IN_PROGRESS' ? 'bg-amber-400' : 'bg-zinc-600'

    return (
      <button
        key={`${entry.type}-${entry.id}`}
        onClick={() => navigate(rowPath)}
        className="inline-flex max-w-full items-center gap-2 rounded border border-zinc-800/80 bg-zinc-900/60 px-2.5 py-1.5 text-left transition hover:border-zinc-600 hover:bg-zinc-900"
      >
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${markerClass}`} />
        <span className="max-w-full whitespace-nowrap text-[13px] leading-5 text-gray-200">{entry.name}</span>
      </button>
    )
  }

  return (
    <div className="w-full px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-100">目録</h1>

      <CatalogControls
        viewMode={viewMode}
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
        onViewModeChange={setViewMode}
        onNewNameChange={setNewName}
        onNewCategoryChange={setNewCategory}
        onAdd={handleAdd}
        progressByTab={progressByTab}
        bulkOpen={bulkOpen}
        bulkText={bulkText}
        bulkCategory={bulkCategory}
        bulkResult={bulkResult}
        bulking={bulking}
        onBulkToggle={() => {
          setBulkOpen(!bulkOpen)
          setBulkResult(null)
        }}
        onBulkTextChange={setBulkText}
        onBulkCategoryChange={setBulkCategory}
        onBulk={handleBulk}
      />

      <CatalogProgressBar registered={registered} total={total} />

      <CatalogEntryGrid
        viewMode={viewMode}
        activeTab={activeTab}
        total={total}
        currentEntries={currentEntries}
        groupedItemEntries={groupedItemEntries}
        groupedItemByGameAndCategory={groupedItemByGameAndCategory}
        groupedByGame={groupedByGame}
        renderCard={renderCard}
        renderListRow={renderListRow}
      />
    </div>
  )
}
