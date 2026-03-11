import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom'
import { getBoss, deleteBoss, getItems } from '../api'
import { isLoggedIn, isAdmin } from '../auth'
import type { Boss, Item } from '../types'

export default function BossDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const fromCatalog = searchParams.get('from') === 'catalog'
  const catalogUrl = `/catalog${searchParams.get('gameId') ? `?gameId=${searchParams.get('gameId')}&tab=${searchParams.get('tab') ?? 'BOSS'}` : ''}`
  const [boss, setBoss] = useState<Boss | null>(null)
  const [relatedItems, setRelatedItems] = useState<Item[]>([])
  const loggedIn = isLoggedIn()
  const admin = isAdmin()

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
          <div className="flex flex-wrap items-start justify-between mb-3 gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-100">{boss.name}</h1>
            {loggedIn && (
              <div className="flex gap-2 flex-shrink-0">
                <Link
                  to={`/bosses/${boss.id}/edit`}
                  className="text-gray-100 hover:underline text-sm"
                >
                  編集
                </Link>
                {admin && (
                  <button onClick={handleDelete} className="text-gray-100 hover:underline text-sm">
                    削除
                  </button>
                )}
              </div>
            )}
          </div>

          <Link to={`/games/${boss.gameId}`} className="text-gray-100 hover:underline text-sm">
            {boss.gameName}
          </Link>

          {boss.description && (
            <p className="text-gray-300 mt-4 whitespace-pre-wrap">{boss.description}</p>
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

          <p className="text-xs text-gray-500 mt-6">
            追加日: {new Date(boss.createdAt).toLocaleDateString('ja-JP')}
          </p>
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
