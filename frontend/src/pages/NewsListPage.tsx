import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getGame, getNews } from '../api'
import type { Game } from '../types'
import { usePageMeta } from '../seo'

type NewsItem = { title: string; url: string; publishedAt: string; source: string }

const PAGE_SIZE = 30

export default function NewsListPage() {
  const { id } = useParams<{ id: string }>()
  const [game, setGame] = useState<Game | null>(null)
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  usePageMeta({
    title: `${game?.name ?? 'ゲーム関連ニュース'} | FROMDEX.com`,
    description: `${game?.name ?? 'ゲーム'} に関連するニュース一覧ページです。`,
  })

  useEffect(() => {
    getGame(Number(id)).then((res) => {
      setGame(res.data)
      getNews(res.data.name, 100).then((r) => {
        setNews(r.data)
        setLoading(false)
      }).catch(() => setLoading(false))
    })
  }, [id])

  const totalPages = Math.ceil(news.length / PAGE_SIZE)
  const pageItems = news.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-8 py-6 sm:py-10">
      <Link to={`/games/${id}`} className="text-gray-100 hover:underline text-sm">
        ← {game ? game.name : 'ゲーム詳細'}に戻る
      </Link>

      <h1 className="text-xl sm:text-2xl font-bold text-gray-100 mt-4 mb-6">
        {game ? `「${game.name}」関連ニュース` : '関連ニュース一覧'}
      </h1>

      {loading ? (
        <p className="text-gray-500 text-sm">読み込み中...</p>
      ) : news.length === 0 ? (
        <p className="text-gray-500 text-sm">ニュースが見つかりませんでした</p>
      ) : (
        <>
          <ul className="space-y-2">
            {pageItems.map((item, i) => (
              <li key={i} className="bg-zinc-800 rounded-lg px-4 py-3">
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-gray-100 text-sm hover:text-gray-300 transition line-clamp-2">
                  {item.title}
                </a>
                <div className="flex gap-3 mt-1 text-xs text-gray-500">
                  {item.source && <span>{item.source}</span>}
                  {item.publishedAt && <span>{new Date(item.publishedAt).toLocaleDateString('ja-JP')}</span>}
                </div>
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <div className="flex gap-2 justify-center mt-6">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => { setPage(p); window.scrollTo(0, 0) }}
                  className={`px-3 py-1.5 rounded text-sm transition ${
                    p === page
                      ? 'bg-red-900 text-white'
                      : 'border border-white/30 text-gray-300 hover:border-white/60'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
