import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getNpc, deleteNpc, getItems } from '../api'
import { isLoggedIn, isAdmin } from '../auth'
import type { Npc, Item } from '../types'

export default function NpcDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [npc, setNpc] = useState<Npc | null>(null)
  const [relatedItems, setRelatedItems] = useState<Item[]>([])
  const loggedIn = isLoggedIn()
  const admin = isAdmin()

  useEffect(() => {
    const npcId = Number(id)
    getNpc(npcId).then((res) => {
      const loaded = res.data
      setNpc(loaded)
      if (loaded.tags.length > 0) {
        // NPCタグ名をキーワードとしてアイテムの名前・説明文に部分一致検索
        getItems(loaded.gameId).then((r) => {
          const npcTagNames = loaded.tags.map((t) => t.name.toLowerCase())
          const related = r.data.filter((item) => {
            const name = item.name.toLowerCase()
            const desc = (item.description || '').toLowerCase()
            return npcTagNames.some((kw) => name.includes(kw) || desc.includes(kw))
          })
          setRelatedItems(related)
        })
      }
    })
  }, [id])

  const handleDelete = async () => {
    if (!confirm('このNPCを削除しますか？')) return
    await deleteNpc(Number(id))
    navigate('/npcs')
  }

  if (!npc) return <div className="text-center py-12 text-gray-400">読み込み中...</div>

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-8 py-6 sm:py-10">
      <Link to="/npcs" className="text-gray-100 hover:underline text-sm">← NPC一覧</Link>

      <div className="bg-zinc-800 rounded-lg shadow mt-4 overflow-hidden">
        {npc.imagePath ? (
          <img
            src={`/uploads/${npc.imagePath}`}
            alt={npc.name}
            className="w-full max-h-[500px] object-contain bg-zinc-900"
          />
        ) : (
          <div className="w-full h-48 bg-zinc-700 flex items-center justify-center text-gray-500">
            画像なし
          </div>
        )}

        <div className="p-5 sm:p-8">
          <div className="flex flex-wrap items-start justify-between mb-3 gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-100">{npc.name}</h1>
            {loggedIn && (
              <div className="flex gap-2 flex-shrink-0">
                <Link
                  to={`/npcs/${npc.id}/edit`}
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

          <Link to={`/games/${npc.gameId}`} className="text-gray-100 hover:underline text-sm">
            {npc.gameName}
          </Link>

          {npc.description && (
            <p className="text-gray-300 mt-4 whitespace-pre-wrap">{npc.description}</p>
          )}

          {npc.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {npc.tags.map((t) => (
                <span key={t.id} className="bg-red-950 text-white text-sm px-3 py-1 rounded-full">
                  {t.name}
                </span>
              ))}
            </div>
          )}

          <p className="text-xs text-gray-500 mt-6">
            追加日: {new Date(npc.createdAt).toLocaleDateString('ja-JP')}
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
                    {npc.tags
                      .filter((nt) => {
                        const kw = nt.name.toLowerCase()
                        return item.name.toLowerCase().includes(kw) || (item.description || '').toLowerCase().includes(kw)
                      })
                      .map((nt) => (
                        <span key={nt.id} className="bg-red-950 text-white text-xs px-1.5 py-0.5 rounded-full">
                          {nt.name}
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
