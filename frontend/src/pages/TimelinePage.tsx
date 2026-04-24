import { useEffect, useState, useRef } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import {
  getTimeline, saveTimeline, getUserTimeline, saveUserTimeline,
  getGame, getBosses, getNpcs, getItems,
} from '../api'
import { isAdmin, isLoggedIn } from '../auth'
import type { Timeline, TimelineEvent, Boss, Npc, Item, Game } from '../types'

type Tab = 'official' | 'personal'
type Layout = 'horizontal' | 'vertical'

interface EventDraft {
  tempId: string
  title: string
  description: string
  imagePath: string
  eraLabel: string
  organizations: string
  bossIds: number[]
  npcIds: number[]
  itemIds: number[]
}

function emptyDraft(): EventDraft {
  return {
    tempId: `new-${Date.now()}`,
    title: '',
    description: '',
    imagePath: '',
    eraLabel: '',
    organizations: '',
    bossIds: [],
    npcIds: [],
    itemIds: [],
  }
}

function eventToPayload(drafts: EventDraft[]) {
  return drafts.map((d, i) => ({
    title: d.title,
    description: d.description || null,
    imagePath: d.imagePath || null,
    eraLabel: d.eraLabel || null,
    orderIndex: i,
    organizations: d.organizations
      ? d.organizations.split(',').map((s) => s.trim()).filter(Boolean)
      : [],
    bossIds: d.bossIds,
    npcIds: d.npcIds,
    itemIds: d.itemIds,
  }))
}

function timelineToDrafts(events: TimelineEvent[]): EventDraft[] {
  return events.map((e) => ({
    tempId: String(e.id),
    title: e.title,
    description: e.description ?? '',
    imagePath: e.imagePath ?? '',
    eraLabel: e.eraLabel ?? '',
    organizations: e.organizations?.join(', ') ?? '',
    bossIds: e.bosses.map((b) => b.id),
    npcIds: e.npcs.map((n) => n.id),
    itemIds: e.items.map((it) => it.id),
  }))
}

// ---- 表示用イベントカード ----
function EventCard({ event, org }: { event: TimelineEvent; org?: string }) {
  const [expanded, setExpanded] = useState(false)
  if (org && !event.organizations?.includes(org)) return null
  const hasLinks = event.bosses.length > 0 || event.npcs.length > 0 || event.items.length > 0

  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 min-w-[200px] max-w-xs flex-shrink-0 shadow-md">
      {event.eraLabel && (
        <span className="text-xs text-amber-400/80 font-semibold tracking-wide">{event.eraLabel}</span>
      )}
      <h3 className="text-sm font-bold text-gray-100 mt-1 leading-snug">{event.title}</h3>
      {event.imagePath && (
        <img src={`/uploads/${event.imagePath}`} alt={event.title} className="w-full h-28 object-cover rounded mt-2" />
      )}
      {event.organizations?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {event.organizations.map((o) => (
            <span key={o} className="text-xs bg-zinc-700 text-zinc-300 px-1.5 py-0.5 rounded">{o}</span>
          ))}
        </div>
      )}
      {event.description && (
        <>
          <p className={`text-xs text-gray-400 mt-2 leading-relaxed ${expanded ? '' : 'line-clamp-3'}`}>
            {event.description}
          </p>
          {event.description.length > 80 && (
            <button onClick={() => setExpanded(!expanded)} className="text-xs text-zinc-500 hover:text-zinc-300 mt-1 transition">
              {expanded ? '折りたたむ' : '続きを読む'}
            </button>
          )}
        </>
      )}
      {hasLinks && (
        <div className="mt-3 space-y-1">
          {event.bosses.map((b) => (
            <Link key={b.id} to={`/bosses/${b.id}`} className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition">
              {b.imagePath && <img src={`/uploads/${b.imagePath}`} className="w-5 h-5 object-cover rounded" />}
              <span>{b.name}</span>
            </Link>
          ))}
          {event.npcs.map((n) => (
            <Link key={n.id} to={`/npcs/${n.id}`} className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition">
              {n.imagePath && <img src={`/uploads/${n.imagePath}`} className="w-5 h-5 object-cover rounded" />}
              <span>{n.name}</span>
            </Link>
          ))}
          {event.items.map((it) => (
            <Link key={it.id} to={`/items/${it.id}`} className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition">
              {it.imagePath && <img src={`/uploads/${it.imagePath}`} className="w-5 h-5 object-cover rounded" />}
              <span>{it.name}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

// ---- 編集用イベントカード（アコーディオン + ドラッグハンドル）----
function EventEditorCard({
  draft,
  isExpanded,
  onToggle,
  onChange,
  onDelete,
  bosses,
  npcs,
  items,
  dragHandleProps,
  isDragging,
}: {
  draft: EventDraft
  isExpanded: boolean
  onToggle: () => void
  onChange: (d: EventDraft) => void
  onDelete: () => void
  bosses: Boss[]
  npcs: Npc[]
  items: Item[]
  dragHandleProps: React.HTMLAttributes<HTMLDivElement>
  isDragging: boolean
}) {
  const toggle = (ids: number[], id: number) =>
    ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]

  return (
    <div
      className={`bg-zinc-800 border rounded-lg transition-all ${
        isDragging ? 'border-amber-500/60 opacity-50' : 'border-zinc-700'
      }`}
    >
      {/* ---- ヘッダー行（常に表示） ---- */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        {/* ドラッグハンドル */}
        <div
          {...dragHandleProps}
          className="cursor-grab active:cursor-grabbing text-zinc-500 hover:text-zinc-300 transition select-none px-1 text-lg leading-none flex-shrink-0"
          title="ドラッグで並び替え"
        >
          ⠿
        </div>

        {/* タイトル表示 */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onToggle}>
          <div className="flex items-center gap-2">
            {draft.eraLabel && (
              <span className="text-xs text-amber-400/80 font-semibold shrink-0">{draft.eraLabel}</span>
            )}
            <span className={`text-sm truncate ${draft.title ? 'text-gray-100' : 'text-zinc-500 italic'}`}>
              {draft.title || '（タイトル未入力）'}
            </span>
          </div>
        </div>

        {/* 展開/折りたたみ・削除 */}
        <button
          onClick={onToggle}
          className="text-xs text-zinc-400 hover:text-zinc-200 transition px-2 py-1 rounded hover:bg-zinc-700 shrink-0"
        >
          {isExpanded ? '折りたたむ ▲' : '編集 ▼'}
        </button>
        <button
          onClick={onDelete}
          className="text-xs text-red-500/70 hover:text-red-400 transition px-1 shrink-0"
          title="削除"
        >
          ✕
        </button>
      </div>

      {/* ---- 編集フォーム（展開時のみ） ---- */}
      {isExpanded && (
        <div className="border-t border-zinc-700 px-4 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-400 mb-0.5">時代ラベル</label>
              <input
                type="text"
                value={draft.eraLabel}
                onChange={(e) => onChange({ ...draft, eraLabel: e.target.value })}
                placeholder="例: 古の時代"
                className="w-full bg-zinc-700 border border-zinc-600 rounded px-2 py-1.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-800"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-0.5">タイトル *</label>
              <input
                type="text"
                value={draft.title}
                onChange={(e) => onChange({ ...draft, title: e.target.value })}
                placeholder="イベント名"
                className="w-full bg-zinc-700 border border-zinc-600 rounded px-2 py-1.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-0.5">説明</label>
            <textarea
              value={draft.description}
              onChange={(e) => onChange({ ...draft, description: e.target.value })}
              rows={3}
              placeholder="イベントの説明..."
              className="w-full bg-zinc-700 border border-zinc-600 rounded px-2 py-1.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-800 resize-y"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-0.5">関連組織（カンマ区切り）</label>
            <input
              type="text"
              value={draft.organizations}
              onChange={(e) => onChange({ ...draft, organizations: e.target.value })}
              placeholder="例: 円卓の騎士, 黄金樹教会"
              className="w-full bg-zinc-700 border border-zinc-600 rounded px-2 py-1.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-800"
            />
          </div>

          {bosses.length > 0 && (
            <div>
              <label className="block text-xs text-gray-400 mb-1">関連ボス</label>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                {bosses.map((b) => {
                  const sel = draft.bossIds.includes(b.id)
                  return (
                    <button key={b.id} onClick={() => onChange({ ...draft, bossIds: toggle(draft.bossIds, b.id) })}
                      className={`text-xs px-2 py-1 rounded border transition ${sel ? 'bg-red-900/60 border-red-700 text-red-200' : 'bg-zinc-700 border-zinc-600 text-zinc-300 hover:border-zinc-400'}`}>
                      {b.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {npcs.length > 0 && (
            <div>
              <label className="block text-xs text-gray-400 mb-1">関連NPC</label>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                {npcs.map((n) => {
                  const sel = draft.npcIds.includes(n.id)
                  return (
                    <button key={n.id} onClick={() => onChange({ ...draft, npcIds: toggle(draft.npcIds, n.id) })}
                      className={`text-xs px-2 py-1 rounded border transition ${sel ? 'bg-blue-900/60 border-blue-700 text-blue-200' : 'bg-zinc-700 border-zinc-600 text-zinc-300 hover:border-zinc-400'}`}>
                      {n.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {items.length > 0 && (
            <div>
              <label className="block text-xs text-gray-400 mb-1">関連アイテム</label>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                {items.map((it) => {
                  const sel = draft.itemIds.includes(it.id)
                  return (
                    <button key={it.id} onClick={() => onChange({ ...draft, itemIds: toggle(draft.itemIds, it.id) })}
                      className={`text-xs px-2 py-1 rounded border transition ${sel ? 'bg-emerald-900/60 border-emerald-700 text-emerald-200' : 'bg-zinc-700 border-zinc-600 text-zinc-300 hover:border-zinc-400'}`}>
                      {it.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ---- ドラッグソート可能なリスト ----
function DraggableEventList({
  drafts,
  expandedIdx,
  onToggle,
  onChange,
  onDelete,
  onReorder,
  bosses,
  npcs,
  items,
}: {
  drafts: EventDraft[]
  expandedIdx: number | null
  onToggle: (idx: number) => void
  onChange: (idx: number, d: EventDraft) => void
  onDelete: (idx: number) => void
  onReorder: (from: number, to: number) => void
  bosses: Boss[]
  npcs: Npc[]
  items: Item[]
}) {
  const dragIdx = useRef<number | null>(null)
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null)
  const [overIdx, setOverIdx] = useState<number | null>(null)

  const handleDragStart = (idx: number) => {
    dragIdx.current = idx
    setDraggingIdx(idx)
  }

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    setOverIdx(idx)
  }

  const handleDrop = (idx: number) => {
    if (dragIdx.current !== null && dragIdx.current !== idx) {
      onReorder(dragIdx.current, idx)
    }
    dragIdx.current = null
    setDraggingIdx(null)
    setOverIdx(null)
  }

  const handleDragEnd = () => {
    dragIdx.current = null
    setDraggingIdx(null)
    setOverIdx(null)
  }

  return (
    <div className="space-y-2">
      {drafts.map((d, idx) => (
        <div
          key={d.tempId}
          onDragOver={(e) => handleDragOver(e, idx)}
          onDrop={() => handleDrop(idx)}
          className={`transition-all ${overIdx === idx && draggingIdx !== idx ? 'ring-2 ring-amber-400/50 rounded-lg' : ''}`}
        >
          <EventEditorCard
            draft={d}
            isExpanded={expandedIdx === idx}
            onToggle={() => onToggle(idx)}
            onChange={(updated) => onChange(idx, updated)}
            onDelete={() => onDelete(idx)}
            bosses={bosses}
            npcs={npcs}
            items={items}
            isDragging={draggingIdx === idx}
            dragHandleProps={{
              draggable: true,
              onDragStart: () => handleDragStart(idx),
              onDragEnd: handleDragEnd,
            }}
          />
        </div>
      ))}
    </div>
  )
}

// ---- メインページ ----
export default function TimelinePage() {
  const { id: gameId } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const orgFilter = searchParams.get('org') ?? undefined

  const admin = isAdmin()
  const loggedIn = isLoggedIn()

  const [game, setGame] = useState<Game | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('official')
  const [layout, setLayout] = useState<Layout>('horizontal')
  const [editing, setEditing] = useState(false)

  const [officialEvents, setOfficialEvents] = useState<TimelineEvent[]>([])
  const [personalEvents, setPersonalEvents] = useState<TimelineEvent[]>([])

  const [drafts, setDrafts] = useState<EventDraft[]>([])
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)
  const [bosses, setBosses] = useState<Boss[]>([])
  const [npcs, setNpcs] = useState<Npc[]>([])
  const [items, setItems] = useState<Item[]>([])

  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)

  const gid = Number(gameId)

  useEffect(() => {
    const reqs: Promise<any>[] = [
      getGame(gid),
      getTimeline(gid).catch(() => null),
      getBosses(gid),
      getNpcs(gid),
      getItems(gid),
    ]
    if (loggedIn) reqs.push(getUserTimeline(gid).catch(() => null))

    Promise.all(reqs).then(([gameRes, officialRes, bossRes, npcRes, itemRes, personalRes]) => {
      setGame(gameRes.data)
      setBosses(bossRes.data)
      setNpcs(npcRes.data)
      setItems(itemRes.data)

      const off: TimelineEvent[] = officialRes?.data?.events ?? []
      const per: TimelineEvent[] = personalRes?.data?.events ?? []
      setOfficialEvents(off)
      setPersonalEvents(per)

      if (loggedIn && per.length > 0) setActiveTab('personal')
    })
  }, [gameId])

  const currentEvents = activeTab === 'official' ? officialEvents : personalEvents
  const canEdit = (activeTab === 'official' && admin) || (activeTab === 'personal' && loggedIn)

  const startEdit = () => {
    setDrafts(timelineToDrafts(currentEvents))
    setExpandedIdx(null)
    setEditing(true)
  }

  const cancelEdit = () => {
    setEditing(false)
    setDrafts([])
    setExpandedIdx(null)
  }

  const handleSave = async () => {
    const validDrafts = drafts.filter((d) => d.title.trim())
    setSaving(true)
    try {
      const payload = eventToPayload(validDrafts)
      if (activeTab === 'official') {
        const res = await saveTimeline(gid, payload as any)
        setOfficialEvents(res.data.events)
      } else {
        const res = await saveUserTimeline(gid, payload as any)
        setPersonalEvents(res.data.events)
      }
      setSaveMsg('保存しました')
      setEditing(false)
      setDrafts([])
      setExpandedIdx(null)
    } catch (_) {
      setSaveMsg('保存に失敗しました')
    } finally {
      setSaving(false)
      setTimeout(() => setSaveMsg(null), 3000)
    }
  }

  const addDraft = () => {
    const newDraft = emptyDraft()
    setDrafts((d) => [...d, newDraft])
    setExpandedIdx(drafts.length) // 新規追加時は自動展開
  }

  const toggleExpanded = (idx: number) =>
    setExpandedIdx((prev) => (prev === idx ? null : idx))

  const updateDraft = (idx: number, d: EventDraft) =>
    setDrafts((prev) => prev.map((x, i) => (i === idx ? d : x)))

  const deleteDraft = (idx: number) => {
    setDrafts((prev) => prev.filter((_, i) => i !== idx))
    setExpandedIdx((prev) => (prev === idx ? null : prev !== null && prev > idx ? prev - 1 : prev))
  }

  const reorderDrafts = (from: number, to: number) => {
    setDrafts((prev) => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
    // 展開中のカードを追う
    setExpandedIdx((prev) => {
      if (prev === null) return null
      if (prev === from) return to
      if (from < to && prev > from && prev <= to) return prev - 1
      if (from > to && prev < from && prev >= to) return prev + 1
      return prev
    })
  }

  const filteredEvents = orgFilter
    ? currentEvents.filter((e) => e.organizations?.includes(orgFilter))
    : currentEvents

  return (
    <div className="min-h-screen bg-zinc-950 text-gray-100">
      {/* ヘッダー */}
      <div className="bg-zinc-900 border-b border-zinc-700 px-4 sm:px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Link to={`/games/${gameId}`} className="text-sm text-gray-400 hover:text-gray-200 transition">
            ← {game?.name ?? 'ゲーム詳細'}
          </Link>
          <span className="text-zinc-600">|</span>
          <h1 className="text-sm font-bold text-gray-100">年表</h1>
          {orgFilter && (
            <span className="text-xs bg-zinc-700 text-zinc-300 px-2 py-0.5 rounded">
              {orgFilter} でフィルター中
              <Link to={`/timeline/${gameId}`} className="ml-1.5 text-zinc-500 hover:text-zinc-300">✕</Link>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* タブ */}
          <div className="flex items-center gap-1 bg-zinc-800 rounded-md p-0.5 text-xs">
            <button
              onClick={() => { setActiveTab('official'); setEditing(false) }}
              className={`px-3 py-1 rounded transition ${activeTab === 'official' ? 'bg-zinc-600 text-gray-100' : 'text-gray-500 hover:text-gray-300'}`}
            >
              管理人の年表
            </button>
            {loggedIn ? (
              <button
                onClick={() => { setActiveTab('personal'); setEditing(false) }}
                className={`px-3 py-1 rounded transition ${activeTab === 'personal' ? 'bg-zinc-600 text-gray-100' : 'text-gray-500 hover:text-gray-300'}`}
              >
                ユーザーの年表
              </button>
            ) : (
              <Link to="/login" className="px-3 py-1 rounded text-zinc-600 hover:text-zinc-400 transition">
                ユーザーの年表
              </Link>
            )}
          </div>

          {/* レイアウト切替 */}
          {!editing && (
            <div className="flex items-center gap-1 bg-zinc-800 rounded-md p-0.5 text-xs">
              <button
                onClick={() => setLayout('horizontal')}
                className={`px-2 py-1 rounded transition ${layout === 'horizontal' ? 'bg-zinc-600 text-gray-100' : 'text-gray-500 hover:text-gray-300'}`}
                title="横スクロール"
              >横</button>
              <button
                onClick={() => setLayout('vertical')}
                className={`px-2 py-1 rounded transition ${layout === 'vertical' ? 'bg-zinc-600 text-gray-100' : 'text-gray-500 hover:text-gray-300'}`}
                title="縦スクロール"
              >縦</button>
            </div>
          )}

          {/* 編集ボタン */}
          {canEdit && !editing && (
            <button
              onClick={startEdit}
              className="text-xs px-3 py-1.5 rounded border border-zinc-600 text-gray-300 hover:border-zinc-400 hover:text-gray-100 transition"
            >
              編集
            </button>
          )}
          {editing && (
            <div className="flex items-center gap-2">
              {saveMsg && (
                <span className={`text-xs ${saveMsg.includes('失敗') ? 'text-red-400' : 'text-green-400'}`}>{saveMsg}</span>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className="text-xs px-4 py-1.5 rounded border border-amber-400/70 bg-amber-300/10 text-amber-200 hover:bg-amber-300/20 disabled:opacity-40 transition"
              >
                {saving ? '保存中...' : '保存する'}
              </button>
              <button
                onClick={cancelEdit}
                className="text-xs px-3 py-1.5 rounded border border-zinc-600 text-gray-400 hover:text-gray-200 transition"
              >
                キャンセル
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ---- 編集モード ---- */}
      {editing ? (
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
          <p className="text-xs text-zinc-500">⠿ をドラッグして並び替え / タイトルまたは「編集▼」をクリックして展開</p>
          <DraggableEventList
            drafts={drafts}
            expandedIdx={expandedIdx}
            onToggle={toggleExpanded}
            onChange={updateDraft}
            onDelete={deleteDraft}
            onReorder={reorderDrafts}
            bosses={bosses}
            npcs={npcs}
            items={items}
          />
          <button
            onClick={addDraft}
            className="w-full py-3 rounded-lg border-2 border-dashed border-zinc-600 text-zinc-400 hover:border-zinc-400 hover:text-zinc-200 text-sm transition"
          >
            ＋ イベントを追加
          </button>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
          <p className="text-sm">年表にイベントがありません</p>
          {canEdit && (
            <button onClick={startEdit} className="mt-3 text-sm text-zinc-400 hover:text-zinc-200 underline transition">
              イベントを追加する
            </button>
          )}
        </div>
      ) : layout === 'horizontal' ? (
        /* 横スクロール */
        <div className="px-6 py-8 overflow-x-auto">
          <div className="relative min-w-max">
            <div className="absolute left-0 right-0 top-[22px] h-px bg-zinc-700 z-0" />
            <div className="flex gap-8 relative z-10 items-start pt-8">
              {filteredEvents.map((event, idx) => (
                <div key={event.id} className="flex flex-col items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-amber-500 border-2 border-amber-300 shadow-md -mt-8" />
                  <div className={idx % 2 === 0 ? '' : 'mt-12'}>
                    <EventCard event={event} org={orgFilter} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* 縦スクロール */
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-zinc-700" />
            <div className="space-y-6 pl-10">
              {filteredEvents.map((event) => (
                <div key={event.id} className="relative">
                  <div className="absolute -left-[26px] top-4 w-3 h-3 rounded-full bg-amber-500 border-2 border-amber-300" />
                  <EventCard event={event} org={orgFilter} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
