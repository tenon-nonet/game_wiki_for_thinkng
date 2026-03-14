import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { getBoss, deleteBoss, getItems } from '../api'
import { isAdmin } from '../auth'
import MessageOverlay from '../components/MessageOverlay'
import { parseDialogueLines } from '../dialogues'
import type { Boss, Item } from '../types'

export default function BossDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const locationState = (location.state as { flashMessage?: string } | null) ?? null
  const [searchParams] = useSearchParams()
  const fromCatalog = searchParams.get('from') === 'catalog'
  const fromEncyclopedia = searchParams.get('from') === 'bosses'
  const catalogUrl = `/catalog${searchParams.get('gameId') ? `?gameId=${searchParams.get('gameId')}&tab=${searchParams.get('tab') ?? 'BOSS'}` : ''}`
  const detailQueryFromCatalog = `?from=catalog${searchParams.get('gameId') ? `&gameId=${searchParams.get('gameId')}` : ''}&tab=${searchParams.get('tab') ?? 'BOSS'}`
  const detailQueryFromEncyclopedia = '?from=bosses'
  const [boss, setBoss] = useState<Boss | null>(null)
  const [relatedItems, setRelatedItems] = useState<Item[]>([])
  const [flashMessage, setFlashMessage] = useState('')
  const [showFlash, setShowFlash] = useState(false)
  const admin = isAdmin()
  const dialogues = parseDialogueLines(boss?.dialogues)

  useEffect(() => {
    if (!locationState?.flashMessage) return
    setFlashMessage(locationState.flashMessage)
    setShowFlash(true)
  }, [locationState?.flashMessage])

  const closeFlash = () => {
    setShowFlash(false)
    if (!locationState?.flashMessage) return
    const { flashMessage: _flashMessage, ...restState } = locationState
    navigate(`${location.pathname}${location.search}`, { replace: true, state: restState })
  }

  useEffect(() => {
    const bossId = Number(id)
    getBoss(bossId).then((res) => {
      const loaded = res.data
      setBoss(loaded)
      if (loaded.tags.length > 0) {
        // ボスタグ名をキーワードとしてアイテムの名前・説明文に部分一致検索
        getItems(loaded.gameId).then((r) => {
          const bossTagNames = loaded.tags.map((t) => t.name.toLowerCase())
          const related = r.data.filter((item) => {
            const name = item.name.toLowerCase()
            const desc = (item.description || '').toLowerCase()
            return bossTagNames.some((kw) => name.includes(kw) || desc.includes(kw))
          })
          setRelatedItems(related)
        })
      }
    })
  }, [id])

  const handleDelete = async () => {
    if (!confirm('このボスを削除しますか？')) return
    await deleteBoss(Number(id))
    navigate('/bosses')
  }

  if (!boss) return <div className="text-center py-12 text-gray-400">読み込み中...</div>

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-8 py-6 sm:py-10">
      {showFlash && <MessageOverlay message={flashMessage} onClose={closeFlash} />}
      <div className="flex items-center gap-4">
        <Link to="/bosses" className="text-gray-100 hover:underline text-sm">← ボス一覧</Link>
        {fromCatalog && <Link to={catalogUrl} className="text-gray-400 hover:underline text-sm">← 目録</Link>}
      </div>

      <div className="bg-zinc-800 rounded-lg shadow mt-4 overflow-hidden">
        {boss.imagePath ? (
          <img
            src={`/uploads/${boss.imagePath}`}
            alt={boss.name}
            className="w-full max-h-[500px] object-contain bg-zinc-900"
          />
          ) : (
          <div className="w-full h-48 bg-zinc-700 flex items-center justify-center text-gray-500">
            画像なし
          </div>
        )}

        <div className="p-5 sm:p-8">
          <Link to={`/games/${boss.gameId}`} className="text-gray-100 hover:underline text-sm">
            {boss.gameName}
          </Link>

          <div className="mt-2 flex flex-wrap items-start justify-between gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-100">{boss.name}</h1>
            <div className="hidden flex-shrink-0 items-center gap-3 sm:flex">
              <Link
                to={`/bosses/${boss.id}/edit${fromCatalog ? detailQueryFromCatalog : fromEncyclopedia ? detailQueryFromEncyclopedia : ''}`}
                className="inline-flex items-center rounded-md border border-amber-400/70 bg-gradient-to-b from-amber-300/30 via-amber-500/20 to-transparent px-5 py-2.5 text-base font-semibold tracking-[0.1em] text-amber-50 shadow-[0_0_28px_rgba(245,158,11,0.18)] transition hover:border-amber-300/90 hover:bg-amber-300/24 hover:text-white"
              >
                情報を追加する
              </Link>
              {admin && (
                <button onClick={handleDelete} className="text-gray-100 hover:underline text-sm">
                  削除
                </button>
              )}
            </div>
          </div>

          {boss.description && (
            <p className="text-gray-300 mt-4 whitespace-pre-wrap">{boss.description}</p>
          )}

          <div className="mt-4 sm:hidden">
            <Link
              to={`/bosses/${boss.id}/edit${fromCatalog ? detailQueryFromCatalog : fromEncyclopedia ? detailQueryFromEncyclopedia : ''}`}
              className="inline-flex w-full items-center justify-center rounded-md border border-amber-400/70 bg-gradient-to-b from-amber-300/30 via-amber-500/20 to-transparent px-5 py-2.5 text-base font-semibold tracking-[0.1em] text-amber-50 shadow-[0_0_28px_rgba(245,158,11,0.18)] transition hover:border-amber-300/90 hover:bg-amber-300/24 hover:text-white"
            >
              情報を追加する
            </Link>
          </div>

          {boss.dialogues?.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">セリフ</h2>
              <div className="space-y-2">
                {dialogues.filter((entry) => entry.text).map((entry, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <span className="text-xs text-gray-500 mt-1 w-20 shrink-0">{entry.label}</span>
                    <p className="text-gray-200 text-sm whitespace-pre-wrap bg-zinc-700 rounded px-4 py-2 flex-1">
                      {entry.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {boss.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {boss.tags.map((t) => (
                <span key={t.id} className="bg-red-950 text-white text-sm px-3 py-1 rounded-full">
                  {t.name}
                </span>
              ))}
            </div>
          )}

          <div className="mt-6 space-y-1 text-xs text-gray-500">
            <p>追加日: {new Date(boss.createdAt).toLocaleDateString('ja-JP')}</p>
            <p>更新日: {new Date(boss.updatedAt).toLocaleDateString('ja-JP')}</p>
            {boss.updatedBy && <p>最終編集者: {boss.updatedBy}</p>}
          </div>
        </div>
      </div>

      {/* 関連アイテム */}
      {relatedItems.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-gray-100 mb-4">関連アイテム</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {relatedItems.map((item) => (
              <Link
                key={item.id}
                to={`/items/${item.id}`}
                className="group bg-zinc-800 rounded-lg overflow-hidden hover:ring-1 hover:ring-red-700 transition"
              >
                {item.imagePath ? (
                  <img
                    src={`/uploads/${item.imagePath}`}
                    alt={item.name}
                    className="w-full h-32 object-contain bg-zinc-900"
                  />
                ) : (
                  <div className="w-full h-32 bg-zinc-700 flex items-center justify-center text-gray-500 text-xs">
                    画像なし
                  </div>
                )}
                <div className="p-2">
                  <p className="text-gray-100 text-sm font-medium line-clamp-1">{item.name}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {boss.tags
                      .filter((bt) => {
                        const kw = bt.name.toLowerCase()
                        return item.name.toLowerCase().includes(kw) || (item.description || '').toLowerCase().includes(kw)
                      })
                      .map((bt) => (
                        <span key={bt.id} className="bg-red-950 text-white text-xs px-1.5 py-0.5 rounded-full">
                          {bt.name}
                        </span>
                      ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}


