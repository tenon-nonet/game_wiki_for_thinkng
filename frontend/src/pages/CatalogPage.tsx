import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getGames, getItems, getBosses, getNpcs, getCatalogEntries, createCatalogEntry, deleteCatalogEntry, bulkCreateCatalogEntries } from '../api'
import { isLoggedIn, isAdmin } from '../auth'
import type { Game, Item, Boss, Npc, CatalogEntry } from '../types'

type TabType = 'ITEM' | 'BOSS' | 'NPC'

const TAB_CONFIG: { key: TabType; label: string }[] = [
  { key: 'ITEM', label: 'アイテム' },
  { key: 'BOSS', label: 'ボス' },
  { key: 'NPC', label: 'NPC' },
]

const ITEM_CATEGORIES = ['武器', '防具', '消費アイテム', '素材', 'タリスマン', 'その他']

export default function CatalogPage() {
  const [games, setGames] = useState<Game[]>([])
  const [selectedGameId, setSelectedGameId] = useState<number>(0)
  const [activeTab, setActiveTab] = useState<TabType>('ITEM')

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
    getGames().then((r) => {
      setGames(r.data)
      if (r.data.length > 0) setSelectedGameId(r.data[0].id)
    })
  }, [])

  // ゲーム変更時: Wiki + 目録 を取得
  useEffect(() => {
    if (!selectedGameId) return
    getItems(selectedGameId).then((r) => setItems(r.data))
    getBosses(selectedGameId).then((r) => setBosses(r.data))
    getNpcs(selectedGameId).then((r) => setNpcs(r.data))
    getCatalogEntries(selectedGameId).then((r) => setCatalogEntries(r.data))
    setKeyword('')
  }, [selectedGameId])

  const loadCatalog = () => {
    if (!selectedGameId) return
    getCatalogEntries(selectedGameId).then((r) => setCatalogEntries(r.data))
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

  // 進捗計算（Wikiエントリありを「登録済み」とする）
  const progress = (tab: TabType) => {
    const all = entriesForTab(tab)
    const registered = all.filter((e) => !!findWiki(e.name, tab)).length
    return { registered, total: all.length }
  }

  // 目録エントリ追加
  const handleAdd = async () => {
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
    } catch {
      alert('一括登録に失敗しました')
    } finally {
      setBulking(false)
    }
  }

  const currentEntries = filteredEntries(activeTab)
  const { registered, total } = progress(activeTab)
  const pct = total === 0 ? 0 : Math.round((registered / total) * 100)

  // ITEMタブ: カテゴリ別グループ化
  const groupedItemEntries = (() => {
    if (activeTab !== 'ITEM') return null
    const groups: { label: string; entries: CatalogEntry[] }[] = []
    const categoryOrder = [...ITEM_CATEGORIES, '未分類']
    const map = new Map<string, CatalogEntry[]>()
    for (const entry of currentEntries) {
      const key = entry.category || '未分類'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(entry)
    }
    for (const cat of categoryOrder) {
      const entries = map.get(cat)
      if (entries && entries.length > 0) groups.push({ label: cat, entries })
    }
    return groups
  })()

  const renderCard = (entry: CatalogEntry, tab: TabType) => {
    const wiki = findWiki(entry.name, tab)
    const done = !!wiki
    const borderColor = done ? 'border-zinc-700 hover:border-red-800' : 'border-zinc-800'
    const dotColor = done ? 'bg-green-500' : 'bg-zinc-600'
    return (
      <div key={entry.id} className={`relative flex flex-col gap-1 px-2.5 py-2 rounded border bg-zinc-900 transition ${borderColor} group`}>
        <div className="flex items-start justify-between gap-1">
          <span className="text-xs leading-tight break-all text-gray-100">
            {entry.name}
          </span>
          <span className={`shrink-0 mt-0.5 w-2 h-2 rounded-full ${dotColor}`} title={done ? '登録済' : '未登録'} />
        </div>
        <div className="flex items-center gap-2">
          {wiki ? (
            <Link to={`/${wikiPath(tab)}/${wiki.id}`} className="text-xs text-green-400 hover:text-green-300 hover:underline">登録済</Link>
          ) : isLoggedIn() ? (
            <Link to={`${wikiNewPath(tab)}?name=${encodeURIComponent(entry.name)}&gameId=${selectedGameId}`} className="text-xs text-zinc-500 hover:text-gray-300 hover:underline">未登録</Link>
          ) : (
            <span className="text-xs text-zinc-600">未登録</span>
          )}
          {isAdmin() && (
            <button onClick={() => handleDelete(entry.id)} className="text-xs text-zinc-600 hover:text-red-400 transition ml-auto" title="削除">×</button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-100 mb-6">目録</h1>

      {/* ゲーム選択 + キーワード絞り込み */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <select
          value={selectedGameId}
          onChange={(e) => {
            setSelectedGameId(Number(e.target.value))
            setKeyword('')
          }}
          className="border border-gray-600 rounded px-3 py-2 bg-zinc-800 text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-800 text-sm"
        >
          {games.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="名前で絞り込み..."
          className="border border-gray-600 rounded px-3 py-2 bg-zinc-800 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-800 text-sm w-52"
        />
      </div>

      {/* タブ */}
      <div className="flex gap-1 mb-6 bg-zinc-900 rounded-lg p-1 w-fit">
        {TAB_CONFIG.map((tab) => {
          const { registered: r, total: t } = progress(tab.key)
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setAddError('') }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
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

      {/* 進捗バー */}
      <div className="mb-5">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>登録済み {registered} / {total}</span>
          <span>{pct}%</span>
        </div>
        <div className="w-full bg-zinc-800 rounded-full h-1.5">
          <div
            className="bg-red-800 h-1.5 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* 操作パネル */}
      {isLoggedIn() && selectedGameId > 0 && (
        <div className="mb-5 flex flex-wrap gap-2 items-start">
          {/* 単体追加 */}
          <div className="flex gap-1.5 items-center flex-1 min-w-0">
            {activeTab === 'ITEM' && (
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="border border-gray-600 rounded px-2 py-1.5 bg-zinc-800 text-gray-100 focus:outline-none focus:ring-1 focus:ring-red-800 text-xs shrink-0"
              >
                <option value="">カテゴリ</option>
                {ITEM_CATEGORIES.map((c) => (
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
              className="w-56 border border-gray-600 rounded px-3 py-1.5 bg-zinc-800 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-800 text-xs"
            />
            <button
              onClick={handleAdd}
              disabled={adding || !newName.trim()}
              className="px-3 py-1.5 bg-red-900 hover:bg-red-800 text-white text-xs rounded disabled:opacity-50 transition shrink-0"
            >
              追加
            </button>
            {addError && <span className="text-red-400 text-xs">{addError}</span>}
          </div>

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
                <div className="absolute right-0 top-full mt-1 z-10 w-72 bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-lg space-y-2">
                  {activeTab === 'ITEM' && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 shrink-0">カテゴリ</span>
                      <select
                        value={bulkCategory}
                        onChange={(e) => setBulkCategory(e.target.value)}
                        className="flex-1 border border-gray-600 rounded px-2 py-1 bg-zinc-800 text-gray-100 focus:outline-none focus:ring-1 focus:ring-red-800 text-xs"
                      >
                        <option value="">未分類</option>
                        {ITEM_CATEGORIES.map((c) => (
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
      {activeTab === 'ITEM' && groupedItemEntries ? (
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
      ) : (
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
