import type { Boss, CatalogEntry, Game, Item, Npc } from '../types'

export type TabType = 'ITEM' | 'BOSS' | 'NPC'
export type EntryStatus = 'REGISTERED' | 'IN_PROGRESS' | 'UNREGISTERED'
export type WikiEntity = Item | Boss | Npc

export const TAB_CONFIG: { key: TabType; label: string }[] = [
  { key: 'ITEM', label: 'アイテム' },
  { key: 'BOSS', label: 'ボス' },
  { key: 'NPC', label: 'NPC' },
]

export const VALID_TABS: TabType[] = ['ITEM', 'BOSS', 'NPC']
export const UNCATEGORIZED_LABEL = '未分類'

export function findWikiEntity(
  entry: CatalogEntry,
  tab: TabType,
  items: Item[],
  bosses: Boss[],
  npcs: Npc[],
): WikiEntity | undefined {
  if (tab === 'ITEM') return items.find((item) => item.id === entry.id)
  if (tab === 'BOSS') return bosses.find((boss) => boss.id === entry.id)
  return npcs.find((npc) => npc.id === entry.id)
}

export function getEntryStatus(
  entry: CatalogEntry,
  tab: TabType,
  items: Item[],
  bosses: Boss[],
  npcs: Npc[],
): EntryStatus {
  const wiki = findWikiEntity(entry, tab, items, bosses, npcs)
  if (!wiki) return 'UNREGISTERED'

  const hasImage = Boolean(wiki.imagePath)
  const hasDescription = Boolean(wiki.description?.trim())
  const hasTags = Boolean(wiki.tags?.length)

  if (hasImage && hasDescription) return 'REGISTERED'
  if (!hasImage && !hasDescription && !hasTags) return 'UNREGISTERED'
  return 'IN_PROGRESS'
}

export function filterEntries(entries: CatalogEntry[], keyword: string) {
  if (!keyword.trim()) return entries
  const lower = keyword.toLowerCase()
  return entries.filter((entry) => entry.name.toLowerCase().includes(lower))
}

export function groupItemsByCategory(entries: CatalogEntry[], categoryOrder: string[]) {
  const map = new Map<string, CatalogEntry[]>()
  for (const entry of entries) {
    const key = entry.category || UNCATEGORIZED_LABEL
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(entry)
  }

  const groups: { label: string; entries: CatalogEntry[] }[] = []
  const orderedCategories = [...categoryOrder, UNCATEGORIZED_LABEL]
  for (const category of orderedCategories) {
    const categoryEntries = map.get(category)
    if (categoryEntries?.length) groups.push({ label: category, entries: categoryEntries })
  }
  for (const [category, categoryEntries] of map.entries()) {
    if (!orderedCategories.includes(category)) {
      groups.push({ label: category, entries: categoryEntries })
    }
  }
  return groups
}

export function groupItemsByGameAndCategory(entries: CatalogEntry[], games: Game[]) {
  const gameMap = new Map<string, Map<string, CatalogEntry[]>>()
  for (const entry of entries) {
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
      const orderedCategories = game?.categories ?? []
      return {
        gameName,
        categories: groupItemsByCategory(Array.from(categoryMap.values()).flat(), orderedCategories),
      }
    })
}

export function groupEntriesByGame(entries: CatalogEntry[], games: Game[]) {
  const map = new Map<string, CatalogEntry[]>()
  for (const entry of entries) {
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
    .map(([gameName, groupedEntries]) => ({ gameName, entries: groupedEntries }))
}
