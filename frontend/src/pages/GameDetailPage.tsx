import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getGame, updateGame, deleteGame, getNews } from '../api'
import type { GameFormData } from '../api'
import { isAdmin } from '../auth'
import type { Game } from '../types'

type NewsItem = { title: string; url: string; publishedAt: string; source: string }

export default function GameDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [game, setGame] = useState<Game | null>(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<GameFormData>({ name: '', description: '', platforms: '', releaseDates: '', awards: '', staff: '' })
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [news, setNews] = useState<NewsItem[]>([])
  const [newsLoading, setNewsLoading] = useState(true)
  const admin = isAdmin()

  useEffect(() => {
    getGame(Number(id)).then((res) => {
      setGame(res.data)
      setForm({
        name: res.data.name,
        description: res.data.description || '',
        platforms: res.data.platforms || '',
        releaseDates: res.data.releaseDates || '',
        awards: res.data.awards || '',
        staff: res.data.staff || '',
      })
      setNewsLoading(true)
      getNews(res.data.name, 5).then((r) => {
        setNews(r.data)
        setNewsLoading(false)
      }).catch(() => setNewsLoading(false))
    })
  }, [id])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setImage(file)
    setPreview(file ? URL.createObjectURL(file) : null)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    // カテゴリはタグ管理画面で編集するため、既存の値をそのまま引き継ぐ
    const res = await updateGame(Number(id), { ...form, categories: game?.categories ?? [] }, image)
    setGame(res.data)
    setEditing(false)
    setImage(null)
    setPreview(null)
  }

  const handleDelete = async () => {
    if (!confirm('このゲームを削除しますか？')) return
    await deleteGame(Number(id))
    navigate('/games')
  }

  if (!game) return <div className="text-center py-12 text-gray-400">読み込み中...</div>

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-8 py-6 sm:py-10">
      <Link to="/games" className="text-gray-100 hover:underline text-sm">← ゲーム一覧</Link>

      <div className="bg-zinc-800 rounded-lg shadow mt-4 overflow-hidden">
        {!editing && game.imagePath && (
          <img
            src={`/uploads/${game.imagePath}`}
            alt={game.name}
            className="w-full max-h-96 object-contain bg-zinc-900"
          />
        )}

        <div className="p-5 sm:p-8">
          {editing ? (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">ゲーム名</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full border border-gray-600 rounded px-3 py-2 bg-zinc-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-800 text-xl font-bold"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">説明</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={4}
                  className="w-full border border-gray-600 rounded px-3 py-2 bg-zinc-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-800"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">プラットフォーム</label>
                <input
                  type="text"
                  placeholder="例: PS5, PC, Xbox"
                  value={form.platforms}
                  onChange={(e) => setForm({ ...form, platforms: e.target.value })}
                  className="w-full border border-gray-600 rounded px-3 py-2 bg-zinc-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-800"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">発売日</label>
                <textarea
                  placeholder={"例:\n本編: 2022/2/25\nDLC1: 2023/3/21"}
                  value={form.releaseDates}
                  onChange={(e) => setForm({ ...form, releaseDates: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-600 rounded px-3 py-2 bg-zinc-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-800"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">受賞歴 (1行1件)</label>
                <textarea
                  value={form.awards}
                  onChange={(e) => setForm({ ...form, awards: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-600 rounded px-3 py-2 bg-zinc-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-800"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">主要スタッフ</label>
                <textarea
                  placeholder={"例:\nディレクター: 宮崎英高\nプロデューサー: XXX"}
                  value={form.staff}
                  onChange={(e) => setForm({ ...form, staff: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-600 rounded px-3 py-2 bg-zinc-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-800"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">画像を変更</label>
                {(preview || game.imagePath) && (
                  <img
                    src={preview || `/uploads/${game.imagePath}`}
                    alt="preview"
                    className="w-24 h-24 object-cover rounded mb-2 border border-gray-600"
                  />
                )}
                <input type="file" accept="image/*" onChange={handleImageChange} className="text-sm text-gray-400" />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="bg-red-900 hover:bg-red-800 text-white px-4 py-2 rounded text-sm">
                  保存
                </button>
                <button
                  type="button"
                  onClick={() => { setEditing(false); setImage(null); setPreview(null) }}
                  className="bg-zinc-700 hover:bg-gray-600 text-gray-200 px-4 py-2 rounded text-sm"
                >
                  キャンセル
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between mb-3 gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-100">{game.name}</h1>
                {admin && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => setEditing(true)} className="text-gray-100 hover:underline text-sm">編集</button>
                    <button onClick={handleDelete} className="text-gray-100 hover:underline text-sm">削除</button>
                  </div>
                )}
              </div>
              {game.description && <p className="text-gray-300 mb-4">{game.description}</p>}
              <dl className="text-sm space-y-3 mb-4">
                {game.platforms && (
                  <div>
                    <dt className="text-gray-500 text-xs mb-0.5">プラットフォーム</dt>
                    <dd className="text-gray-200">{game.platforms}</dd>
                  </div>
                )}
                {game.releaseDates && (
                  <div>
                    <dt className="text-gray-500 text-xs mb-0.5">発売日</dt>
                    <dd className="text-gray-200 whitespace-pre-wrap">{game.releaseDates}</dd>
                  </div>
                )}
                {game.awards && (
                  <div>
                    <dt className="text-gray-500 text-xs mb-0.5">受賞歴</dt>
                    <dd className="text-gray-200 whitespace-pre-wrap">{game.awards}</dd>
                  </div>
                )}
                {game.staff && (
                  <div>
                    <dt className="text-gray-500 text-xs mb-0.5">主要スタッフ</dt>
                    <dd className="text-gray-200 whitespace-pre-wrap">{game.staff}</dd>
                  </div>
                )}
              </dl>
              <p className="text-xs text-gray-500">追加日: {new Date(game.createdAt).toLocaleDateString('ja-JP')}</p>
            </>
          )}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <Link
          to={`/items?gameId=${game.id}`}
          className="inline-flex items-center justify-center rounded-md border border-amber-400/70 bg-gradient-to-b from-amber-300/30 via-amber-500/20 to-transparent px-4 py-2 text-sm font-semibold tracking-[0.08em] text-amber-50 shadow-[0_0_22px_rgba(245,158,11,0.16)] transition hover:border-amber-300/90 hover:bg-amber-300/24 hover:text-white"
        >
          図録を見る →
        </Link>
      </div>

      {/* 関連ニュース */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-100">関連ニュース</h2>
          {!newsLoading && news.length > 0 && (
            <Link to={`/games/${game.id}/news`} className="text-gray-100 hover:underline text-sm">
              関連ニュース一覧 →
            </Link>
          )}
        </div>
        {newsLoading ? (
          <p className="text-gray-500 text-sm">読み込み中...</p>
        ) : news.length === 0 ? (
          <p className="text-gray-500 text-sm">ニュースが見つかりませんでした</p>
        ) : (
          <ul className="space-y-2">
            {news.map((item, i) => (
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
        )}
      </div>
    </div>
  )
}
