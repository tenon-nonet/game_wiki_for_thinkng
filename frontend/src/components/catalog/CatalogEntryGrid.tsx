import type { CatalogEntry } from '../../types'
import type { TabType } from '../../pages/catalogUtils'

type Group = {
  label: string
  entries: CatalogEntry[]
}

type GroupedByGame = {
  gameName: string
  entries: CatalogEntry[]
}

type GroupedItemsByGame = {
  gameName: string
  categories: Group[]
}

type Props = {
  viewMode: 'card' | 'list'
  activeTab: TabType
  total: number
  currentEntries: CatalogEntry[]
  groupedItemEntries: Group[] | null
  groupedItemByGameAndCategory: GroupedItemsByGame[] | null
  groupedByGame: GroupedByGame[] | null
  renderCard: (entry: CatalogEntry, tab: TabType) => React.ReactNode
  renderListRow: (entry: CatalogEntry, tab: TabType) => React.ReactNode
}

function EmptyState({ total }: { total: number }) {
  return (
    <p className="py-8 text-center text-sm text-gray-500">
      {total === 0 ? '目録データがありません' : '該当するデータがありません'}
    </p>
  )
}

export default function CatalogEntryGrid({
  viewMode,
  activeTab,
  total,
  currentEntries,
  groupedItemEntries,
  groupedItemByGameAndCategory,
  groupedByGame,
  renderCard,
  renderListRow,
}: Props) {
  const renderEntries = (entries: CatalogEntry[], tab: TabType) =>
    viewMode === 'card' ? (
      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-10">
        {entries.map((entry) => renderCard(entry, tab))}
      </div>
    ) : (
      <div className="flex flex-wrap gap-2 rounded border border-zinc-800 bg-zinc-950/60 p-3">
        {entries.map((entry) => renderListRow(entry, tab))}
      </div>
    )

  if (groupedItemByGameAndCategory) {
    return (
      <div className="space-y-8">
        {groupedItemByGameAndCategory.length === 0 ? (
          <EmptyState total={total} />
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
                    {renderEntries(category.entries, 'ITEM')}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    )
  }

  if (groupedItemEntries) {
    return (
      <div className="space-y-6">
        {groupedItemEntries.length === 0 ? (
          <EmptyState total={total} />
        ) : (
          groupedItemEntries.map((group) => (
            <div key={group.label}>
              <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
                {group.label}
                <span className="ml-2 text-zinc-600 normal-case font-normal">{group.entries.length}件</span>
              </h2>
              {renderEntries(group.entries, 'ITEM')}
            </div>
          ))
        )}
      </div>
    )
  }

  if (groupedByGame) {
    return (
      <div className="space-y-8">
        {groupedByGame.length === 0 ? (
          <EmptyState total={total} />
        ) : (
          groupedByGame.map(({ gameName, entries }) => (
            <div key={gameName}>
              <h2 className="mb-3 border-b border-zinc-700 px-1 pb-1 text-sm font-semibold text-gray-300">
                {gameName}
                <span className="ml-2 text-xs font-normal text-zinc-500">{entries.length}件</span>
              </h2>
              {renderEntries(entries, activeTab)}
            </div>
          ))
        )}
      </div>
    )
  }

  return (
    <div>
      {currentEntries.length === 0 ? (
        <EmptyState total={total} />
      ) : (
        renderEntries(currentEntries, activeTab)
      )}
    </div>
  )
}
