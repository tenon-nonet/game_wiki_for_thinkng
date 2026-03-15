import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getGames, createGame, updateGameOrder } from '../api'
import type { GameFormData } from '../api'
import { isAdmin } from '../auth'
import { usePageMeta } from '../seo'
import { GAME_IMAGE_FILE_SIZE_ERROR, isGameImageFileSizeValid } from '../upload'
import type { Game } from '../types'

export default function GamesPage() {
  usePageMeta({
    title: 'ゲーム一覧 | FROMDEX.com',
    description: 'FromSoftware作品のゲーム一覧ページ。各作品の詳細、図録、関連情報へ移動できます。',
  })

  const [games, setGames] = useState<Game[]>([])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const emptyForm = (): GameFormData => ({ name: '', description: '', platforms: '', releaseDates: '', awards: '', staff: '', visible: true })
  const [form, setForm] = useState<GameFormData>(emptyForm())
  const [categoriesText, setCategoriesText] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const admin = isAdmin()

  const load = async (q?: string) => {
    const res = await getGames(q)
    setGames(res.data)
  }

  useEffect(() => { load() }, [])

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    load(search || undefined)
  }

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    try {
      const categories = categoriesText.split('\n').map((s) => s.trim()).filter(Boolean)
      await createGame({ ...form, categories }, image)
      setForm(emptyForm())
      setCategoriesText('')
      setImage(null)
      setPreview(null)
      setShowForm(false)
      load()
    } catch (err: any) {
      setError(err.response?.data?.error || '追加に失敗しました')
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    if (!isGameImageFileSizeValid(file)) {
      setError(GAME_IMAGE_FILE_SIZE_ERROR)
      setImage(null)
      setPreview(null)
      e.target.value = ''
      return
    }
    setImage(file)
    setPreview(file ? URL.createObjectURL(file) : null)
  }

  const handleDragStart = (index: number) => setDragIndex(index)

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDrop = async (index: number) => {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null)
      setDragOverIndex(null)
      return
    }
    const newGames = [...games]
    const [moved] = newGames.splice(dragIndex, 1)
    newGames.splice(index, 0, moved)
    setGames(newGames)
    setDragIndex(null)
    setDragOverIndex(null)
    await updateGameOrder(newGames.map((g) => g.id))
  }

  const handleDragEnd = () => {
    setDragIndex(null)
    setDragOverIndex(null)
  }

  return (
    <div className="w-full px-4 sm:px-8 py-6 sm:py-10">
      <div className="flex flex-wrap items-center justify-between mb-6 gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-100">ゲーム一覧</h1>
        {admin && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-red-900 hover:bg-red-800 text-white px-4 py-2 rounded text-sm whitespace-nowrap"
          >
            + ゲーム追加
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-zinc-800 rounded-lg shadow p-4 mb-6 space-y-3">
          {error && <p className="text-gray-100 text-sm">{error}</p>}
          <input
            type="text"
            placeholder="ゲーム名"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="w-full border border-gray-600 rounded px-3 py-2 bg-zinc-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-800"
          />
          <textarea
            placeholder="説明"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            className="w-full border border-gray-600 rounded px-3 py-2 bg-zinc-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-800"
          />
          <input
            type="text"
            placeholder="プラットフォーム (例: PS5, PC, Xbox)"
            value={form.platforms}
            onChange={(e) => setForm({ ...form, platforms: e.target.value })}
            className="w-full border border-gray-600 rounded px-3 py-2 bg-zinc-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-800"
          />
          <textarea
            placeholder={"発売日 (例:\n本編: 2022/2/25\nDLC1: 2023/3/21)"}
            value={form.releaseDates}
            onChange={(e) => setForm({ ...form, releaseDates: e.target.value })}
            rows={3}
            className="w-full border border-gray-600 rounded px-3 py-2 bg-zinc-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-800"
          />
          <textarea
            placeholder={"受賞歴 (1行1件)"}
            value={form.awards}
            onChange={(e) => setForm({ ...form, awards: e.target.value })}
            rows={2}
            className="w-full border border-gray-600 rounded px-3 py-2 bg-zinc-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-800"
          />
          <textarea
            placeholder={"主要スタッフ (例:\nディレクター: 宮崎英高\nプロデューサー: XXX)"}
            value={form.staff}
            onChange={(e) => setForm({ ...form, staff: e.target.value })}
            rows={3}
            className="w-full border border-gray-600 rounded px-3 py-2 bg-zinc-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-800"
          />
          <textarea
            placeholder={"アイテムカテゴリ (1行1件、例:\n武器\n防具\n消費アイテム)"}
            value={categoriesText}
            onChange={(e) => setCategoriesText(e.target.value)}
            rows={4}
            className="w-full border border-gray-600 rounded px-3 py-2 bg-zinc-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-800"
          />
          <label className="flex items-center gap-2 text-sm text-gray-200">
            <input
              type="checkbox"
              checked={form.visible ?? true}
              onChange={(e) => setForm({ ...form, visible: e.target.checked })}
              className="h-4 w-4 rounded border-gray-500 bg-zinc-700 text-red-800 focus:ring-red-800"
            />
            公開する
          </label>
          <div>
            <label className="block text-sm text-gray-300 mb-1">画像</label>
            {preview && <img src={preview} alt="preview" className="w-full h-32 object-contain bg-zinc-900 rounded mb-2 border border-gray-600" />}
            <input type="file" accept="image/*" onChange={handleImageChange} className="text-sm text-gray-400" />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-red-900 hover:bg-red-800 text-white px-4 py-2 rounded text-sm">保存</button>
            <button type="button" onClick={() => { setShowForm(false); setImage(null); setPreview(null) }} className="bg-zinc-700 hover:bg-gray-600 text-gray-200 px-4 py-2 rounded text-sm">キャンセル</button>
          </div>
        </form>
      )}

      <form onSubmit={handleSearch} className="flex gap-2 mb-8 max-w-xl w-full">
        <input
          type="text"
          placeholder="ゲームを検索..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-gray-600 rounded px-3 py-2 bg-zinc-800 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-800"
        />
        <button type="submit" className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm">検索</button>
        {search && (
          <button type="button" onClick={() => { setSearch(''); load() }} className="bg-zinc-700 hover:bg-gray-600 text-gray-200 px-3 py-2 rounded text-sm">クリア</button>
        )}
      </form>

      {games.length === 0 ? (
        <p className="text-gray-500 text-sm">まだゲームが登録されていません</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {games.map((game, index) => (
            <div
              key={game.id}
              className={`bg-zinc-800 rounded-lg shadow overflow-hidden transition-all duration-200 ${admin ? 'cursor-grab active:cursor-grabbing' : ''} ${dragOverIndex === index && dragIndex !== index ? 'ring-2 ring-red-700 opacity-75' : ''}`}
              draggable={admin}
              onDragStart={() => admin && handleDragStart(index)}
              onDragOver={(e) => admin && handleDragOver(e, index)}
              onDrop={() => admin && handleDrop(index)}
              onDragEnd={handleDragEnd}
            >
              <Link to={`/games/${game.id}`} className="block">
                {game.imagePath ? (
                  <img
                    src={`/uploads/${game.imagePath}`}
                    alt={game.name}
                    className="w-full max-h-96 object-contain bg-zinc-900"
                  />
                ) : (
                  <div className="w-full h-40 bg-zinc-900 flex items-center justify-center text-zinc-600 text-sm">画像未登録</div>
                )}
              </Link>
              <div className="p-5 sm:p-8">
                <div className="mb-3">
                  <Link to={`/games/${game.id}`} className="text-xl sm:text-2xl font-bold text-gray-100 hover:text-gray-300 transition">
                    {game.name}
                  </Link>
                </div>
                {admin && !game.visible && (
                  <p className="mb-3 inline-flex rounded border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-xs text-amber-200">
                    非公開
                  </p>
                )}
                {game.description && <p className="text-gray-300 mb-4 whitespace-pre-wrap">{game.description}</p>}
                <dl className="text-sm space-y-2 mb-4">
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
                </dl>
                <p className="text-xs text-gray-500 mb-4">追加日: {new Date(game.createdAt).toLocaleDateString('ja-JP')}</p>
                <Link
                  to={`/items?gameId=${game.id}`}
                  className="inline-flex items-center justify-center rounded-md border border-amber-400/70 bg-gradient-to-b from-amber-300/30 via-amber-500/20 to-transparent px-4 py-2 text-sm font-semibold tracking-[0.08em] text-amber-50 shadow-[0_0_22px_rgba(245,158,11,0.16)] transition hover:border-amber-300/90 hover:bg-amber-300/24 hover:text-white"
                >
                  図録を見る
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
