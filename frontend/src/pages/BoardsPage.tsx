import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getBoardGames } from '../api'
import { usePageMeta } from '../seo'
import type { BoardGameSummary } from '../types'

export default function BoardsPage() {
  usePageMeta({
    title: '掲示板 | FROMDEX.com',
    description: 'ゲーム別掲示板の入口。作品ごとの雑談、考察、質問、情報交換ができます。',
  })

  const [games, setGames] = useState<BoardGameSummary[]>([])

  useEffect(() => {
    getBoardGames().then((res) => setGames(res.data))
  }, [])

  return (
    <div className="w-full px-4 py-8 sm:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-100">掲示板</h1>
        <p className="mt-2 text-sm text-gray-400">ゲームごとの雑談、考察、質問、情報共有のための掲示板です。</p>
      </div>

      <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900/90 p-5 shadow-lg">
        <div className="space-y-3">
          <div>
            <h2 className="text-xl font-semibold text-gray-100">総合掲示板</h2>
            <p className="mt-1 text-sm text-gray-400">作品横断の雑談、考察、サイト要望、全体的な話題はこちら。</p>
          </div>
          <Link
            to="/boards/general"
            className="inline-flex items-center justify-center rounded-md border border-amber-400/70 bg-gradient-to-b from-amber-300/30 via-amber-500/20 to-transparent px-4 py-2 text-sm font-semibold tracking-[0.08em] text-amber-50 shadow-[0_0_22px_rgba(245,158,11,0.16)] transition hover:border-amber-300/90 hover:bg-amber-300/24 hover:text-white"
          >
            総合掲示板を見る
          </Link>
        </div>
      </div>

      {games.length === 0 ? (
        <p className="text-sm text-gray-500">公開中のゲームがありません</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {games.map((game) => (
            <div key={game.gameId} className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/90 shadow-lg">
              {game.imagePath ? (
                <img
                  src={`/uploads/${game.imagePath}`}
                  alt={game.gameName}
                  className="h-52 w-full object-contain bg-zinc-950"
                />
              ) : (
                <div className="flex h-52 items-center justify-center bg-zinc-950 text-sm text-zinc-600">画像なし</div>
              )}
              <div className="space-y-3 p-5">
                <div>
                  <h2 className="text-xl font-semibold text-gray-100">{game.gameName}</h2>
                  <p className="mt-1 text-sm text-gray-400">スレッド数: {game.threadCount}</p>
                  {game.latestPostedAt && (
                    <p className="text-xs text-gray-500">
                      最終更新: {new Date(game.latestPostedAt).toLocaleString('ja-JP')}
                    </p>
                  )}
                </div>
                <Link
                  to={`/boards/${game.gameId}`}
                  className="inline-flex items-center justify-center rounded-md border border-amber-400/70 bg-gradient-to-b from-amber-300/30 via-amber-500/20 to-transparent px-4 py-2 text-sm font-semibold tracking-[0.08em] text-amber-50 shadow-[0_0_22px_rgba(245,158,11,0.16)] transition hover:border-amber-300/90 hover:bg-amber-300/24 hover:text-white"
                >
                  掲示板を見る
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
