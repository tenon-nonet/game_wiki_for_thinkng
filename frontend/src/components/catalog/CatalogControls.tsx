import { isAdmin } from '../../auth'
import type { Game } from '../../types'
import { TAB_CONFIG, type TabType } from '../../pages/catalogUtils'

type ProgressByTab = Record<TabType, { registered: number; total: number }>

type Props = {
  viewMode: 'card' | 'list'
  games: Game[]
  selectedGameId: number
  activeTab: TabType
  keyword: string
  newName: string
  newCategory: string
  gameCategories: string[]
  adding: boolean
  addError: string
  onGameChange: (gameId: number) => void
  onKeywordChange: (keyword: string) => void
  onTabChange: (tab: TabType) => void
  onViewModeChange: (mode: 'card' | 'list') => void
  onNewNameChange: (name: string) => void
  onNewCategoryChange: (category: string) => void
  onAdd: () => void
  progressByTab: ProgressByTab
  bulkOpen: boolean
  bulkText: string
  bulkCategory: string
  bulkResult: { added: number; skipped: number } | null
  bulking: boolean
  onBulkToggle: () => void
  onBulkTextChange: (text: string) => void
  onBulkCategoryChange: (category: string) => void
  onBulk: () => void
}

export default function CatalogControls({
  viewMode,
  games,
  selectedGameId,
  activeTab,
  keyword,
  newName,
  newCategory,
  gameCategories,
  adding,
  addError,
  onGameChange,
  onKeywordChange,
  onTabChange,
  onViewModeChange,
  onNewNameChange,
  onNewCategoryChange,
  onAdd,
  progressByTab,
  bulkOpen,
  bulkText,
  bulkCategory,
  bulkResult,
  bulking,
  onBulkToggle,
  onBulkTextChange,
  onBulkCategoryChange,
  onBulk,
}: Props) {
  const admin = isAdmin()

  return (
    <div className="mb-6 flex flex-wrap items-stretch gap-3 sm:items-center">
      <div className="flex w-full items-center gap-2 sm:w-auto">
        <select
          value={selectedGameId}
          onChange={(event) => onGameChange(Number(event.target.value))}
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
        onChange={(event) => onKeywordChange(event.target.value)}
        placeholder={
          activeTab === 'ITEM'
            ? 'アイテム名で絞り込み...'
            : activeTab === 'BOSS'
              ? 'ボス名で絞り込み...'
              : 'NPC名で絞り込み...'
        }
        className="w-full rounded border border-gray-600 bg-zinc-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-800 sm:w-56"
      />

      <div className="flex w-full flex-wrap gap-2 sm:w-auto">
        {TAB_CONFIG.map((tab) => {
          const { registered, total } = progressByTab[tab.key]
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`inline-flex items-center rounded-md border px-3.5 py-1.5 text-sm font-medium transition ${
                activeTab === tab.key
                  ? 'border-amber-400/70 bg-gradient-to-b from-amber-300/30 via-amber-500/20 to-transparent text-amber-50 shadow-[0_0_22px_rgba(245,158,11,0.16)]'
                  : 'border-zinc-700 bg-zinc-900/80 text-gray-300 hover:border-zinc-500 hover:text-gray-100'
              }`}
            >
              {tab.label}
              <span
                className={`ml-2 rounded-sm px-1.5 py-0.5 text-[10px] leading-none ${
                  activeTab === tab.key
                    ? 'bg-amber-200/10 text-amber-200'
                    : 'bg-zinc-800 text-zinc-500'
                }`}
              >
                {registered}/{total}
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex w-full flex-wrap gap-2 sm:ml-auto sm:w-auto">
        <button
          onClick={() => onViewModeChange('card')}
          className={`rounded border px-3 py-2 text-sm transition ${
            viewMode === 'card'
              ? 'border-amber-400/70 bg-amber-300/10 text-amber-100'
              : 'border-zinc-700 bg-zinc-900/80 text-gray-400 hover:border-zinc-500 hover:text-gray-200'
          }`}
        >
          カード表示
        </button>
        <button
          onClick={() => onViewModeChange('list')}
          className={`rounded border px-3 py-2 text-sm transition ${
            viewMode === 'list'
              ? 'border-amber-400/70 bg-amber-300/10 text-amber-100'
              : 'border-zinc-700 bg-zinc-900/80 text-gray-400 hover:border-zinc-500 hover:text-gray-200'
          }`}
        >
          目次表示
        </button>
      </div>

      {admin && selectedGameId > 0 && (
        <div className="ml-0 flex w-full flex-wrap items-center gap-1.5 sm:ml-4 sm:w-auto">
          <span className="mr-1 text-sm text-gray-400">目録追加</span>
          {activeTab === 'ITEM' && (
            <select
              value={newCategory}
              onChange={(event) => onNewCategoryChange(event.target.value)}
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
            onChange={(event) => onNewNameChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') onAdd()
            }}
            placeholder="名前を追加..."
            className="w-full rounded border border-gray-600 bg-zinc-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-800 sm:w-56"
          />
          <button
            onClick={onAdd}
            disabled={adding || !newName.trim()}
            className="rounded bg-red-900 px-3 py-2 text-sm text-white transition hover:bg-red-800 disabled:opacity-50"
          >
            追加
          </button>
          <div className="relative w-full sm:w-auto">
            <button
              onClick={onBulkToggle}
              className="w-full rounded border border-zinc-600 px-3 py-2 text-sm text-gray-300 transition hover:border-zinc-400 hover:text-gray-100 sm:w-auto"
            >
              {bulkOpen ? '−' : '+'} 一括目録追加
            </button>
            {bulkOpen && (
              <div className="absolute right-0 top-full z-10 mt-1 w-[min(32rem,calc(100vw-2rem))] space-y-2 rounded-lg border border-zinc-700 bg-zinc-900 p-3 shadow-lg">
                {activeTab === 'ITEM' && (
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 text-xs text-gray-500">カテゴリ</span>
                    <select
                      value={bulkCategory}
                      onChange={(event) => onBulkCategoryChange(event.target.value)}
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
                  onChange={(event) => onBulkTextChange(event.target.value)}
                  rows={16}
                  placeholder={'名前1\n名前2\n名前3\n...'}
                  className="w-full rounded border border-gray-600 bg-zinc-800 px-2 py-1.5 font-mono text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-800"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={onBulk}
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
          {addError && <span className="text-xs text-red-400">{addError}</span>}
        </div>
      )}
    </div>
  )
}
