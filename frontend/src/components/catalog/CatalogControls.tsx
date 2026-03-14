import { isAdmin } from '../../auth'
import type { Game } from '../../types'
import { TAB_CONFIG, type TabType } from '../../pages/catalogUtils'

type ProgressByTab = Record<TabType, { registered: number; total: number }>

type Props = {
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
  onNewNameChange: (name: string) => void
  onNewCategoryChange: (category: string) => void
  onAdd: () => void
  progressByTab: ProgressByTab
}

export default function CatalogControls({
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
  onNewNameChange,
  onNewCategoryChange,
  onAdd,
  progressByTab,
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
        placeholder={activeTab === 'ITEM' ? 'アイテム名で絞り込み...' : activeTab === 'BOSS' ? 'ボス名で絞り込み...' : 'NPC名で絞り込み...'}
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
          {addError && <span className="text-xs text-red-400">{addError}</span>}
        </div>
      )}
    </div>
  )
}
