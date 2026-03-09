import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getGames } from '../api'
import type { Game } from '../types'

export default function HomePage() {
  const [games, setGames] = useState<Game[]>([])

  useEffect(() => {
    getGames().then((r) => setGames(r.data.slice(0, 6)))
  }, [])

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-100 mb-3">Enlightmenter's Archives 瞳の書院</h1>
        <p className="text-gray-400 text-lg mb-6">考察者或いは啓蒙者の為のアーカイブ、もっと瞳が必要なのだ</p>
        <div className="max-w-2xl mx-auto bg-gray-800 rounded-xl p-6 text-left space-y-3 text-sm text-gray-300">
          <p>🎮 <span className="text-gray-100 font-medium">Enlightmenter's Archives</span> は、ゲームに登場するアイテムの情報をみんなで共有・編集できるWikiサービスです。</p>
          <ul className="space-y-1 pl-4 list-disc text-gray-400">
            <li>ゲームとアイテムを登録して情報を整理</li>
            <li>アイテムにタグを付けて分類・検索</li>
            <li>画像をアップロードしてビジュアルで管理</li>
            <li>アカウント登録でアイテムの追加・編集が可能</li>
          </ul>
          <div className="flex gap-3 pt-2">
            <Link to="/games" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded text-sm font-medium transition">
              ゲーム一覧を見る
            </Link>
            <Link to="/items" className="bg-gray-700 hover:bg-gray-600 text-gray-200 px-4 py-2 rounded text-sm font-medium transition">
              アイテム一覧を見る
            </Link>
          </div>
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold text-gray-200">登録ゲーム</h2>
          <Link to="/games" className="text-indigo-400 hover:underline text-sm">すべて見る →</Link>
        </div>
        {games.length === 0 ? (
          <p className="text-gray-500 text-sm">まだゲームが登録されていません</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {games.map((g) => (
              <Link
                key={g.id}
                to={`/games/${g.id}`}
                className="bg-gray-800 rounded-xl shadow hover:shadow-lg hover:scale-[1.02] transition-all duration-200 overflow-hidden"
              >
                {g.imagePath ? (
                  <img
                    src={`/uploads/${g.imagePath}`}
                    alt={g.name}
                    className="w-full h-44 object-contain bg-gray-900"
                  />
                ) : (
                  <div className="w-full h-44 bg-gray-700 flex items-center justify-center text-gray-500 text-sm">
                    画像なし
                  </div>
                )}
                <div className="p-4">
                  <p className="font-semibold text-gray-100">{g.name}</p>
                  {g.description && (
                    <p className="text-gray-400 text-xs mt-1 line-clamp-2">{g.description}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
