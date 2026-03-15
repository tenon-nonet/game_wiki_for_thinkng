import { useState } from 'react'
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
  canReorder: boolean
  renderCard: (entry: CatalogEntry, tab: TabType) => React.ReactNode
  renderListRow: (entry: CatalogEntry, tab: TabType) => React.ReactNode
  onReorderEntries: (entries: CatalogEntry[]) => void
  onReorderItemGroup: (groupLabel: string, entries: CatalogEntry[]) => void
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
  canReorder,
  renderCard,
  renderListRow,
  onReorderEntries,
  onReorderItemGroup,
}: Props) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const resetDrag = () => {
    setDragIndex(null)
    setDragOverIndex(null)
  }

  const reorderEntries = (
    entries: CatalogEntry[],
    index: number,
    onCommit: (nextEntries: CatalogEntry[]) => void,
  ) => {
    if (dragIndex === null || dragIndex === index) {
      resetDrag()
      return
    }

    const nextEntries = [...entries]
    const [moved] = nextEntries.splice(dragIndex, 1)
    nextEntries.splice(index, 0, moved)
    resetDrag()
    onCommit(nextEntries)
  }

  const renderEntry = (
    entry: CatalogEntry,
    tab: TabType,
    entries: CatalogEntry[],
    index: number,
    onCommit: (nextEntries: CatalogEntry[]) => void,
  ) => {
    const content = viewMode === 'card' ? renderCard(entry, tab) : renderListRow(entry, tab)
    if (!canReorder) return content

    return (
      <div
        key={`${entry.type}-${entry.id}`}
        draggable
        onDragStart={() => setDragIndex(index)}
        onDragOver={(event) => {
          event.preventDefault()
          setDragOverIndex(index)
        }}
        onDrop={() => reorderEntries(entries, index, onCommit)}
        onDragEnd={resetDrag}
        className={`transition ${dragOverIndex === index && dragIndex !== index ? 'ring-2 ring-amber-500/70' : ''}`}
      >
        {content}
      </div>
    )
  }

  const renderEntries = (
    entries: CatalogEntry[],
    tab: TabType,
    onCommit: (nextEntries: CatalogEntry[]) => void,
  ) => viewMode === 'card' ? (
    <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-10">
      {entries.map((entry, index) => renderEntry(entry, tab, entries, index, onCommit))}
    </div>
  ) : (
    <div className="flex flex-wrap gap-2 rounded border border-zinc-800 bg-zinc-950/60 p-3">
      {entries.map((entry, index) => renderEntry(entry, tab, entries, index, onCommit))}
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
                    {renderEntries(category.entries, 'ITEM', (nextEntries) => onReorderItemGroup(category.label, nextEntries))}
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
              {renderEntries(group.entries, 'ITEM', (nextEntries) => onReorderItemGroup(group.label, nextEntries))}
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
              {renderEntries(entries, activeTab, onReorderEntries)}
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
        renderEntries(currentEntries, activeTab, onReorderEntries)
      )}
    </div>
  )
}