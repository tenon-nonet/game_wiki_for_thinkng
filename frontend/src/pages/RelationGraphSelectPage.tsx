import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getGames } from '../api'
import { usePageMeta } from '../seo'
import type { Game } from '../types'

export default function RelationGraphSelectPage() {
  usePageMeta({
    title: '相関図 | FROMDEX.com',
    description: 'ゲームを選択して登場キャラクターの相関図を見る',
  })

  const navigate = useNavigate()
  const [games, setGames] = useState<Game[]>([])

  useEffect(() => {
    getGames().then((res) => setGames(res.data))
  }, [])

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-100 mb-2">相関図</h1>
      <p className="text-sm text-gray-400 mb-8">ゲームを選択してください</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {games.map((game) => (
          <button
            key={game.id}
            onClick={() => navigate(`/games/${game.id}/relation-graph`)}
            className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-500 rounded-lg overflow-hidden transition text-left group"
          >
            {game.imagePath ? (
              <img
                src={`/uploads/${game.imagePath}`}
                alt={game.name}
                className="w-full h-28 object-cover group-hover:opacity-90 transition"
              />
            ) : (
              <div className="w-full h-28 bg-zinc-700 flex items-center justify-center text-3xl">🎮</div>
            )}
            <div className="p-2.5">
              <p className="text-sm font-medium text-gray-100 truncate">{game.name}</p>
            </div>
          </button>
        ))}
      </div>

      {games.length === 0 && (
        <p className="text-gray-500 text-sm">ゲームがありません</p>
      )}
    </div>
  )
}
