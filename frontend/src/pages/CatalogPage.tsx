import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getGames, getItems, getBosses, getNpcs, getCatalogEntries, createCatalogEntry, deleteCatalogEntry, bulkCreateCatalogEntries } from '../api'
import { isLoggedIn, isAdmin } from '../auth'
import type { Game, Item, Boss, Npc, CatalogEntry } from '../types'

type TabType = 'ITEM' | 'BOSS' | 'NPC'
type EntryStatus = 'REGISTERED' | 'IN_PROGRESS' | 'UNREGISTERED'

const TAB_CONFIG: { key: TabType; label: string }[] = [
  { key: 'ITEM', label: 'アイテム' },
  { key: 'BOSS', label: 'ボス' },
  { key: 'NPC', label: 'NPC' },
]

const VALID_TABS: TabType[] = ['ITEM', 'BOSS', 'NPC']

export default function CatalogPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [games, setGames] = useState<Game[]>([])
  const [selectedGameId, setSelectedGameId] = useState<number>(Number(searchParams.get('gameId')) || 0)
  const [activeTab, setActiveTab] = useState<TabType>(
    VALID_TABS.includes(searchParams.get('tab') as TabType) ? (searchParams.get('tab') as TabType) : 'ITEM'
  )

  // Wiki エントリ
  const [items, setItems] = useState<Item[]>([])
  const [bosses, setBosses] = useState<Boss[]>([])
  const [npcs, setNpcs] = useState<Npc[]>([])

  // 目録エントリ
  const [catalogEntries, setCatalogEntries] = useState<CatalogEntry[]>([])

  // UI state
  const [keyword, setKeyword] = useState('')
  const [newName, setNewName] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [addError, setAddError] = useState('')
  const [adding, setAdding] = useState(false)

  // 一括登録
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkText, setBulkText] = useState('')
  const [bulkCategory, setBulkCategory] = useState('')
  const [bulkResult, setBulkResult] = useState<{ added: number; skipped: number } | null>(null)
  const [bulking, setBulking] = useState(false)

  // 初回: ゲーム一覧取得
  useEffect(() => {
    getGames().then((r) => setGames(r.data))
  }, [])

  // URLパラメータを状態に同期
  useEffect(() => {
    const params: Record<string, string> = {}
    if (selectedGameId > 0) params.gameId = String(selectedGameId)
    if (activeTab !== 'ITEM') params.tab = activeTab
    setSearchParams(params, { replace: true })
  }, [selectedGameId, activeTab])

  // ゲーム変更時: Wiki + 目録 を取得
  useEffect(() => {
    const gid = selectedGameId > 0 ? selectedGameId : undefined
    getItems(gid).then((r) => setItems(r.data))
    getBosses(gid).then((r) => setBosses(r.data))
    getNpcs(gid).then((r) => setNpcs(r.data))
    getCatalogEntries(gid).then((r) => setCatalogEntries(r.data))
    setKeyword('')
  }, [selectedGameId])

  const loadWikiEntries = (type?: TabType) => {
    const gid = selectedGameId > 0 ? selectedGameId : undefined
    if (!type || type === 'ITEM') getItems(gid).then((r) => setItems(r.data))
    if (!type || type === 'BOSS') getBosses(gid).then((r) => setBosses(r.data))
    if (!type || type === 'NPC') getNpcs(gid).then((r) => setNpcs(r.data))
  }

  const loadCatalog = () => {
    const gid = selectedGameId > 0 ? selectedGameId : undefined
    getCatalogEntries(gid).then((r) => setCatalogEntries(r.data))
  }

  // タブ対応の目録エントリ
  const entriesForTab = (tab: TabType) =>
    catalogEntries.filter((e) => e.type === tab)

  // Wiki 内の同名エントリを検索
  const findWikiItem = (name: string) =>
    items.find((i) => i.name.toLowerCase() === name.toLowerCase())

  const findWikiBoss = (name: string) =>
    bosses.find((b) => b.name.toLowerCase() === name.toLowerCase())

  const findWikiNpc = (name: string) =>
    npcs.find((n) => n.name.toLowerCase() === name.toLowerCase())

  const findWiki = (name: string, tab: TabType) => {
    if (tab === 'ITEM') return findWikiItem(name)
    if (tab === 'BOSS') return findWikiBoss(name)
    return findWikiNpc(name)
  }

  const getEntryStatus = (entry: CatalogEntry, tab: TabType): EntryStatus => {
    const wiki = findWiki(entry.name, tab)
    if (!wiki) return 'UNREGISTERED'

    const hasImage = !!wiki.imagePath
    const hasDescription = !!wiki.description?.trim()
    const hasTags = !!wiki.tags?.length
    if (hasImage && hasDescription) return 'REGISTERED'
    if (!hasImage && !hasDescription && !hasTags) return 'UNREGISTERED'
    return 'IN_PROGRESS'
  }

  const wikiPath = (tab: TabType) => {
    if (tab === 'ITEM') return 'items'
    if (tab === 'BOSS') return 'bosses'
    return 'npcs'
  }

  const wikiNewPath = (tab: TabType) => {
    if (tab === 'ITEM') return '/items/new'
    if (tab === 'BOSS') return '/bosses/new'
    return '/npcs/new'
  }

  // キーワード絞り込み
  const filteredEntries = (tab: TabType) => {
    const list = entriesForTab(tab)
    if (!keyword.trim()) return list
    return list.filter((e) => e.name.toLowerCase().includes(keyword.toLowerCase()))
  }

  // 進捗計算（画像・説明・タグがすべて入力済みを「登録済み」とする）
  const progress = (tab: TabType) => {
    const all = entriesForTab(tab)
    const registered = all.filter((e) => getEntryStatus(e, tab) === 'REGISTERED').length
    return { registered, total: all.length }
  }

  // 目録エントリ追加
  const handleAdd = async () => {
    if (!isAdmin()) {
      setAddError('目録追加は管理者のみ実行できます')
      return
    }
    if (!newName.trim()) return
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
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } }
      setAddError(err?.response?.data?.error ?? '追加に失敗しました')
    } finally {
      setAdding(false)
    }
  }

  // 目録エントリ削除
  const handleDelete = async (id: number) => {
    if (!confirm('この目録エントリを削除しますか？')) return
    try {
      await deleteCatalogEntry(id)
      setCatalogEntries((prev) => prev.filter((e) => e.id !== id))
    } catch {
      alert('削除に失敗しました')
    }
  }

  const handleBulk = async () => {
    if (!isAdmin()) return
    const names = bulkText.split('\n').map((s) => s.trim()).filter(Boolean)
    if (names.length === 0) return
    setBulking(true)
    setBulkResult(null)
    try {
      const res = await bulkCreateCatalogEntries({
        names,
        type: activeTab,
        gameId: selectedGameId,
        category: activeTab === 'ITEM' && bulkCategory ? bulkCategory : undefined,
      })
      setBulkResult(res.data)
      setBulkText('')
      loadCatalog()
      loadWikiEntries(activeTab)
    } catch {
      alert('一括登録に失敗しました')
    } finally {
      setBulking(false)
    }
  }

  const currentEntries = filteredEntries(activeTab)
  const { registered, total } = progress(activeTab)
  const pct = total === 0 ? 0 : Math.round((registered / total) * 100)
  const isAllGames = selectedGameId === 0
  const selectedGame = games.find((g) => g.id === selectedGameId) ?? null
  const gameCategories: string[] = selectedGame?.categories ?? []

  // 特定ゲーム選択時: ITEMタブはカテゴリ別グループ化
  const groupedItemEntries = (() => {
    if (activeTab !== 'ITEM' || isAllGames) return null
    const groups: { label: string; entries: CatalogEntry[] }[] = []
    const map = new Map<string, CatalogEntry[]>()
    for (const entry of currentEntries) {
      const key = entry.category || '未分類'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(entry)
    }
    const categoryOrder = [...gameCategories, '未分類']
    for (const cat of categoryOrder) {
      const entries = map.get(cat)
      if (entries && entries.length > 0) groups.push({ label: cat, entries })
    }
    for (const [cat, entries] of map.entries()) {
      if (!categoryOrder.includes(cat)) groups.push({ label: cat, entries })
    }
    return groups
  })()

  // すべてのゲーム + ITEMタブ: ゲームごとにカテゴリ表示
  const groupedItemByGameAndCategory = (() => {
    if (!isAllGames || activeTab !== 'ITEM') return null
    const gameMap = new Map<string, Map<string, CatalogEntry[]>>()
    for (const entry of currentEntries) {
      const gameName = entry.gameName
      const category = entry.category || '未分類'
      if (!gameMap.has(gameName)) gameMap.set(gameName, new Map())
      const categoryMap = gameMap.get(gameName)!
      if (!categoryMap.has(category)) categoryMap.set(category, [])
      categoryMap.get(category)!.push(entry)
    }
    const gameOrderMap = new Map(games.map((g, idx) => [g.name, idx]))
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
      const game = games.find((g) => g.name === gameName)
      const orderedCategories = game?.categories ? [...game.categories, '未分類'] : ['未分類']
      const categories: { label: string; entries: CatalogEntry[] }[] = []
      for (const label of orderedCategories) {
        const entries = categoryMap.get(label)
        if (entries && entries.length > 0) categories.push({ label, entries })
      }
      for (const [label, entries] of categoryMap.entries()) {
        if (!orderedCategories.includes(label)) categories.push({ label, entries })
      }
      return { gameName, categories }
    })
  })()

  // すべてのゲーム選択時: ゲーム名でグループ化
  const groupedByGame = (() => {
    if (!isAllGames) return null
    const map = new Map<string, CatalogEntry[]>()
    for (const entry of currentEntries) {
      const key = entry.gameName
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(entry)
    }
    const gameOrderMap = new Map(games.map((g, idx) => [g.name, idx]))
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
    const wiki = findWiki(entry.name, tab)
    const status = getEntryStatus(entry, tab)
    const hasImage = !!wiki?.imagePath
    const borderColor = 'border-zinc-700 hover:border-red-800'
    const detailPath = wiki ? `/${wikiPath(tab)}/${wiki.id}?from=catalog${selectedGameId > 0 ? `&gameId=${selectedGameId}` : ''}&tab=${tab}` : ''
    const newPath = `${wikiNewPath(tab)}?name=${encodeURIComponent(entry.name)}&gameId=${entry.gameId}${tab === 'ITEM' && entry.category ? `&category=${encodeURIComponent(entry.category)}` : ''}`
    const cardPath = wiki ? detailPath : isLoggedIn() ? newPath : ''
    return (
      <div
        key={entry.id}
        className={`relative flex flex-col gap-1 rounded border bg-zinc-900 transition ${borderColor} group overflow-hidden ${cardPath ? 'cursor-pointer' : ''}`}
        onClick={() => {
          if (cardPath) navigate(cardPath)
        }}
      >
        {hasImage ? (
          <img
            src={`/uploads/${wiki.imagePath}`}
            alt={entry.name}
            className="w-full h-16 object-cover object-top"
          />
        ) : (
          <div className="w-full h-16 flex items-center justify-center bg-zinc-800 text-zinc-600 text-xs">
            画像未登録
          </div>
        )}
        <div className="flex flex-col gap-1 px-2.5 py-2">
          <div className="flex items-start justify-between gap-1">
            <span className="text-xs leading-tight break-all text-gray-100">
              {entry.name}
            </span>
          </div>
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
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(entry.id)
                }}
                className="text-xs text-red-400/90 hover:text-red-300 border border-red-500/40 hover:border-red-400/70 rounded px-1.5 py-0.5 transition ml-auto"
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
      <h1 className="text-2xl font-bold text-gray-100 mb-6">目録</h1>

      {/* ゲーム選択 + キーワード絞り込み + タブ */}
      <div className="flex flex-wrap items-stretch sm:items-center gap-3 mb-6">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedGameId}
            onChange={(e) => {
              setSelectedGameId(Number(e.target.value))
              setKeyword('')
            }}
            className="w-full sm:w-auto border border-gray-600 rounded px-3 py-2 bg-zinc-800 text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-800 text-sm"
          >
            <option value={0}>すべて</option>
            {games.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="アイテム名で絞り込み..."
          className="w-full sm:w-56 border border-gray-600 rounded px-3 py-2 bg-zinc-800 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-800 text-sm"
        />

        <div className="flex flex-wrap gap-1 bg-zinc-900 rounded-lg p-1 w-full sm:w-auto">
          {TAB_CONFIG.map((tab) => {
            const { registered: r, total: t } = progress(tab.key)
            return (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setAddError('') }}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                  activeTab === tab.key
                    ? 'bg-red-900 text-white'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {tab.label}
                <span className={`ml-2 text-xs ${activeTab === tab.key ? 'text-red-200' : 'text-gray-600'}`}>
                  {r}/{t}
                </span>
              </button>
            )
          })}
        </div>

        {isAdmin() && selectedGameId > 0 && (
          <div className="ml-0 sm:ml-4 flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            <span className="text-sm text-gray-400 mr-1">目録追加</span>
            {activeTab === 'ITEM' && (
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full sm:w-auto border border-gray-600 rounded px-2 py-2 bg-zinc-800 text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-800 text-sm"
              >
                <option value="">カテゴリ</option>
                {gameCategories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
              placeholder="名称を入力..."
              className="w-full sm:w-56 border border-gray-600 rounded px-3 py-2 bg-zinc-800 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-800 text-sm"
            />
            <button
              onClick={handleAdd}
              disabled={adding || !newName.trim()}
              className="px-3 py-2 bg-red-900 hover:bg-red-800 text-white text-sm rounded disabled:opacity-50 transition"
            >
              追加
            </button>
            {addError && <span className="text-red-400 text-xs">{addError}</span>}
          </div>
        )}
      </div>

      {/* 進捗バー */}
      <div className="mb-5 w-full">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>図録登録済み {registered} / {total}</span>
          <span>{pct}%</span>
        </div>
        <div className="w-full bg-zinc-800 rounded-full h-1.5">
          <div
            className="bg-red-800 h-1.5 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* 操作パネル（特定ゲーム選択時のみ） */}
      {isAdmin() && selectedGameId > 0 && (
        <div className="mb-5 flex flex-wrap gap-2 items-start">
          {/* 一括登録（管理者） */}
          {isAdmin() && (
            <div className="relative">
              <button
                onClick={() => { setBulkOpen(!bulkOpen); setBulkResult(null) }}
                className="px-3 py-1.5 border border-zinc-600 hover:border-zinc-400 text-gray-400 hover:text-gray-200 text-xs rounded transition"
              >
                {bulkOpen ? '▼' : '▶'} 一括登録
              </button>
              {bulkOpen && (
                <div className="absolute right-0 top-full mt-1 z-10 w-[min(18rem,calc(100vw-2rem))] bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-lg space-y-2">
                  {activeTab === 'ITEM' && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 shrink-0">カテゴリ</span>
                      <select
                        value={bulkCategory}
                        onChange={(e) => setBulkCategory(e.target.value)}
                        className="flex-1 border border-gray-600 rounded px-2 py-1 bg-zinc-800 text-gray-100 focus:outline-none focus:ring-1 focus:ring-red-800 text-xs"
                      >
                        <option value="">未分類</option>
                        {gameCategories.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <textarea
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    rows={5}
                    placeholder={'名称1\n名称2\n名称3\n...'}
                    className="w-full border border-gray-600 rounded px-2 py-1.5 bg-zinc-800 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-800 text-xs font-mono"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleBulk}
                      disabled={bulking || !bulkText.trim()}
                      className="px-3 py-1 bg-red-900 hover:bg-red-800 text-white text-xs rounded disabled:opacity-50 transition"
                    >
                      {bulking ? '登録中...' : '一括登録'}
                    </button>
                    {bulkResult && (
                      <span className="text-xs text-green-400">{bulkResult.added}件追加・{bulkResult.skipped}件スキップ</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* エントリ一覧 */}
      {isAllGames && activeTab === 'ITEM' && groupedItemByGameAndCategory ? (
        // すべてのゲーム + ITEMタブ: ゲームごとにカテゴリ別グループ化
        <div className="space-y-8">
          {groupedItemByGameAndCategory.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">目録にエントリがありません</p>
          ) : (
            groupedItemByGameAndCategory.map(({ gameName, categories }) => (
              <div key={gameName}>
                <h2 className="text-sm font-semibold text-gray-300 mb-3 px-1 border-b border-zinc-700 pb-1">
                  {gameName}
                </h2>
                <div className="space-y-4">
                  {categories.map((category) => (
                    <div key={category.label}>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
                        {category.label}
                        <span className="ml-2 text-zinc-600 font-normal normal-case">{category.entries.length}件</span>
                      </h3>
                      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-10 gap-1.5">
                        {category.entries.map((e) => renderCard(e, 'ITEM'))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      ) : activeTab === 'ITEM' && groupedItemEntries ? (
        // 特定ゲーム + ITEMタブ: カテゴリ別グループ化
        <div className="space-y-6">
          {groupedItemEntries.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">
              {total === 0 ? '目録にエントリがありません' : '該当するデータがありません'}
            </p>
          ) : (
            groupedItemEntries.map((group) => (
              <div key={group.label}>
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
                  {group.label}
                  <span className="ml-2 text-zinc-600 font-normal normal-case">{group.entries.length}件</span>
                </h2>
                <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-10 gap-1.5">
                  {group.entries.map((e) => renderCard(e, 'ITEM'))}
                </div>
              </div>
            ))
          )}
        </div>
      ) : isAllGames && groupedByGame ? (
        // すべてのゲーム（BOSS/NPC）: ゲーム名でグループ化
        <div className="space-y-8">
          {groupedByGame.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">目録にエントリがありません</p>
          ) : (
            groupedByGame.map(({ gameName, entries }) => (
              <div key={gameName}>
                <h2 className="text-sm font-semibold text-gray-300 mb-3 px-1 border-b border-zinc-700 pb-1">
                  {gameName}
                  <span className="ml-2 text-zinc-500 font-normal text-xs">{entries.length}件</span>
                </h2>
                <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-10 gap-1.5">
                  {entries.map((e) => renderCard(e, activeTab))}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        // 特定ゲーム・BOSS/NPCタブ
        <div>
          {currentEntries.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">
              {total === 0 ? '目録にエントリがありません' : '該当するデータがありません'}
            </p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-10 gap-1.5">
              {currentEntries.map((e) => renderCard(e, activeTab))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
