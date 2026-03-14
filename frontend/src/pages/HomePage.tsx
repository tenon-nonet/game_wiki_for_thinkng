import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getGames, createGame, updateGame, deleteGame, updateGameOrder, getNews, trackHomeVisit, getItems, getBosses, getNpcs } from '../api'
import { isAdmin } from '../auth'
import { GAME_IMAGE_FILE_SIZE_ERROR, isGameImageFileSizeValid } from '../upload'
import type { Game } from '../types'

export default function HomePage() {
  const FROM_SOFTWARE_NEWS_QUERY = [
    'FromSoftware',
    'フロムソフトウェア',
    'ELDEN RING',
    'ダークソウル',
    'ブラッドボーン',
  ].join(' OR ')

  const [games, setGames] = useState<Game[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({ name: '', description: '' })
  const [editImage, setEditImage] = useState<File | null>(null)
  const [editPreview, setEditPreview] = useState<string | null>(null)
  const admin = isAdmin()
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [news, setNews] = useState<{ title: string; url: string; publishedAt: string; source: string }[]>([])
  const [newsLoading, setNewsLoading] = useState(false)
  const [totalVisitors, setTotalVisitors] = useState<number | null>(null)
  const [totalItems, setTotalItems] = useState<number | null>(null)
  const [totalBosses, setTotalBosses] = useState<number | null>(null)
  const [totalNpcs, setTotalNpcs] = useState<number | null>(null)

  const load = async (q?: string) => {
    const res = await getGames(q)
    setGames(res.data)
    if (!q) {
      Promise.all([getItems(), getBosses(), getNpcs()])
        .then(([itemsRes, bossesRes, npcsRes]) => {
          setTotalItems(itemsRes.data.length)
          setTotalBosses(bossesRes.data.length)
          setTotalNpcs(npcsRes.data.length)
        })
        .catch(() => {
          setTotalItems(null)
          setTotalBosses(null)
          setTotalNpcs(null)
        })
      setNewsLoading(true)
      getNews(FROM_SOFTWARE_NEWS_QUERY, 5).then((r) => {
        setNews(r.data)
        setNewsLoading(false)
      }).catch(() => setNewsLoading(false))
    }
  }

  useEffect(() => { load() }, [])
  useEffect(() => {
    trackHomeVisit()
      .then((r) => setTotalVisitors(r.data.totalUniqueDailyVisitors))
      .catch(() => setTotalVisitors(null))
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await createGame(form, image)
      setForm({ name: '', description: '' })
      setImage(null)
      setPreview(null)
      setShowForm(false)
      load()
    } catch (err: any) {
      setError(err.response?.data?.error || '追加に失敗しました')
    }
  }

  const handleCreateImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    if (!isGameImageFileSizeValid(file)) {
      setError(GAME_IMAGE_FILE_SIZE_ERROR)
      setEditImage(null)
      setEditPreview(null)
      e.target.value = ''
      return
    }
    setEditImage(file)
    setEditPreview(file ? URL.createObjectURL(file) : null)
  }

  const startEdit = (game: Game) => {
    setEditingId(game.id)
    setEditForm({ name: game.name, description: game.description || '' })
    setEditImage(null)
    setEditPreview(null)
  }

  const handleUpdate = async (e: React.FormEvent, game: Game) => {
    e.preventDefault()
    await updateGame(game.id, editForm, editImage)
    setEditingId(null)
    load()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('削除しますか？')) return
    await deleteGame(id)
    load()
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

  const actionVariant: 'bold' | 'calm' = 'calm'
  const primaryActionClassByVariant = {
    bold: 'block w-full bg-gradient-to-r from-red-900 via-red-800 to-red-900 hover:from-red-800 hover:via-red-700 hover:to-red-800 text-white text-sm font-semibold tracking-wide px-4 py-2.5 rounded-md text-center transition',
    calm: 'block w-full rounded-md border border-amber-400/70 bg-gradient-to-b from-amber-300/30 via-amber-500/20 to-transparent px-4 py-2.5 text-center text-sm font-semibold tracking-[0.08em] text-amber-50 shadow-[0_0_28px_rgba(245,158,11,0.18)] transition hover:border-amber-300/90 hover:bg-amber-300/24 hover:text-white',
  } as const
  const secondaryActionClassByVariant = {
    bold: 'inline-block border border-red-500/60 hover:border-red-300 text-red-100 hover:text-white bg-zinc-900/70 text-xs px-3 py-2 rounded-md text-center transition',
    calm: 'inline-block border border-zinc-600/80 hover:border-zinc-400 text-gray-200 hover:text-white bg-transparent text-xs px-3 py-2 rounded-md text-center transition',
  } as const
  const primaryActionClass = primaryActionClassByVariant[actionVariant]
  const secondaryActionClass = secondaryActionClassByVariant[actionVariant]

  return (
    <div className="w-full px-4 py-4 sm:px-6 sm:py-6">
      <section className="mb-8 w-full">
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.16),transparent_34%),linear-gradient(180deg,rgba(24,24,27,0.96),rgba(9,9,11,0.98))] shadow-[0_24px_80px_rgba(0,0,0,0.42)]">
          <div className="grid gap-3 px-3 py-4 sm:gap-4 sm:px-6 sm:py-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1.1fr)_18rem] lg:items-start">
            <div className="space-y-3 pt-1">
              <h1 className="text-[0.82rem] font-semibold leading-snug text-zinc-100 sm:text-4xl lg:text-[1rem]">
                <span className="sm:hidden">
                  かつてビルゲンワースのウィレームは喝破した<br />
                  「我々は、思考の次元が低すぎる。もっと瞳が必要なのだ」
                  <span className="block text-right">―上位者の叡智</span>
                </span>
                <span className="hidden sm:inline">
                  <br/>知ることに終わりはなく、また完全もない。<br />
                  それ故に私は百智卿であり続ける。<br />
                  導きも、或いはそうなのかもしれぬ。<br />
                  その戦いが終わる時、我らは我らで在り続けるものか？
                  <br /><br />
                  ...ああ、君は、どう考えるね、
                  <br />エルデの王にならんとする者よ 
                  <br/>―百智卿、ギデオン=オーフニール

                  <br /><br /><br/>
                  かつてビルゲンワースのウィレームは喝破した<br/>
                  「我々は、思考の次元が低すぎる。もっと瞳が必要なのだ」
                  <br />―上位者の叡智
                </span>
              </h1>
              <div className="flex flex-wrap gap-2 text-sm">
                {admin && (
                  <div className="rounded-full border border-zinc-700 bg-black/30 px-4 py-2 text-zinc-300">
                    収録ゲーム: <span className="text-zinc-100">{games.length}</span>
                  </div>
                )}
                {admin && totalVisitors !== null && (
                  <div className="rounded-full border border-zinc-700 bg-black/30 px-4 py-2 text-zinc-300">
                    訪問者数: <span className="text-zinc-100">{totalVisitors}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3 pt-1 lg:-ml-60 lg:space-y-4">
              <div className="-mx-1 w-auto rounded-xl border border-zinc-800/80 bg-black/30 p-3 backdrop-blur-sm sm:mx-0 sm:w-full">
                <p className="text-sm font-semibold tracking-[0.28em] text-amber-200 sm:text-base">SITE GUIDE</p>
                <div className="mt-2 space-y-3">
                  <div>
                    <p className="text-[0.75rem] leading-6 text-zinc-400 sm:text-base sm:leading-7">
                      FROMDEXは、誰でも編集可能なゲームwiki
                      <br />断片的に記されたゲーム内テキスト情報を収集、編纂する
                      <br />難解かつ緻密、或いは理解不能な世界感を考察、啓蒙を高める
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-100">目録</p>
                    <p className="mt-1 text-[0.75rem] leading-5 text-zinc-400 sm:text-sm sm:leading-6">
                      全体を俯瞰し、全情報を確認。未登録情報に情報を追加できる
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-100">図録</p>
                    <p className="mt-1 text-[0.75rem] leading-5 text-zinc-400 sm:text-sm sm:leading-6">
                      集約された画像と情報を眺める。情報追加やコメントもできる
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-100">情報の追加方法</p>
                    <p className="mt-1 text-[0.75rem] leading-5 text-zinc-400 sm:text-sm sm:leading-6">
                      目録から情報を選択、編集画面で画像、テキストを入力する。
                      既存の情報も変更できるので、より良い画像に差し替えたり校閲する
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 lg:grid-cols-1 lg:gap-3">
              <div className="rounded-xl border border-zinc-800/80 bg-black/25 px-2 py-2 sm:px-4 sm:py-3">
                <p className="text-[9px] tracking-[0.14em] text-zinc-500 sm:text-[11px] sm:tracking-[0.18em]">TOTAL ITEMS</p>
                <p className="mt-1 text-lg font-semibold text-zinc-100 sm:text-2xl">{totalItems ?? '-'}</p>
              </div>
              <div className="rounded-xl border border-zinc-800/80 bg-black/25 px-2 py-2 sm:px-4 sm:py-3">
                <p className="text-[9px] tracking-[0.14em] text-zinc-500 sm:text-[11px] sm:tracking-[0.18em]">TOTAL BOSSES</p>
                <p className="mt-1 text-lg font-semibold text-zinc-100 sm:text-2xl">{totalBosses ?? '-'}</p>
              </div>
              <div className="rounded-xl border border-zinc-800/80 bg-black/25 px-2 py-2 sm:px-4 sm:py-3">
                <p className="text-[9px] tracking-[0.14em] text-zinc-500 sm:text-[11px] sm:tracking-[0.18em]">TOTAL NPCS</p>
                <p className="mt-1 text-lg font-semibold text-zinc-100 sm:text-2xl">{totalNpcs ?? '-'}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full">
        <div className="mb-4 flex items-end justify-between gap-3">
          {admin && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="inline-flex items-center justify-center rounded-md border border-amber-400/70 bg-gradient-to-b from-amber-300/30 via-amber-500/20 to-transparent px-5 py-2.5 text-sm font-semibold tracking-[0.1em] text-amber-50 shadow-[0_0_28px_rgba(245,158,11,0.18)] transition hover:border-amber-300/90 hover:bg-amber-300/24 hover:text-white"
            >
              + ゲーム追加
            </button>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="mb-6 space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/90 p-5 shadow-lg">
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
            <div>
              <label className="block text-sm text-gray-300 mb-1">画像</label>
              {preview && <img src={preview} alt="preview" className="w-full h-32 object-contain bg-zinc-900 rounded mb-2 border border-gray-600" />}
              <input type="file" accept="image/*" onChange={handleCreateImageChange} className="text-sm text-gray-400" />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-red-900 hover:bg-red-800 text-white px-4 py-2 rounded text-sm">保存</button>
              <button type="button" onClick={() => { setShowForm(false); setImage(null); setPreview(null) }} className="bg-zinc-700 hover:bg-gray-600 text-gray-200 px-4 py-2 rounded text-sm">キャンセル</button>
            </div>
          </form>
        )}

        {games.length === 0 ? (
          <p className="text-gray-500 text-sm">まだゲームが登録されていません</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {games.map((game, index) => (
              <div
                key={game.id}
                className={`group overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/90 shadow-[0_16px_48px_rgba(0,0,0,0.32)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_70px_rgba(0,0,0,0.42)] ${admin ? 'cursor-grab active:cursor-grabbing' : ''} ${dragOverIndex === index && dragIndex !== index ? 'ring-2 ring-red-700 opacity-75' : ''}`}
                draggable={admin}
                onDragStart={() => admin && handleDragStart(index)}
                onDragOver={(e) => admin && handleDragOver(e, index)}
                onDrop={() => admin && handleDrop(index)}
                onDragEnd={handleDragEnd}
              >
                {editingId === game.id ? (
                  <form onSubmit={(e) => handleUpdate(e, game)} className="p-4 space-y-3">
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      required
                      className="w-full border border-gray-600 rounded px-3 py-2 bg-zinc-700 text-gray-100 font-semibold focus:outline-none focus:ring-2 focus:ring-red-800"
                    />
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      rows={2}
                      className="w-full border border-gray-600 rounded px-3 py-2 bg-zinc-700 text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-800"
                    />
                    <div>
                      <label className="block text-xs text-gray-300 mb-1">画像を変更</label>
                      {(editPreview || game.imagePath) && (
                        <img src={editPreview || `/uploads/${game.imagePath}`} alt="preview" className="w-full h-32 object-contain bg-zinc-900 rounded mb-2 border border-gray-600" />
                      )}
                      <input type="file" accept="image/*" onChange={handleEditImageChange} className="text-xs text-gray-400" />
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="bg-red-900 hover:bg-red-800 text-white px-3 py-1.5 rounded text-sm">保存</button>
                      <button type="button" onClick={() => setEditingId(null)} className="bg-zinc-700 hover:bg-gray-600 text-gray-200 px-3 py-1.5 rounded text-sm">キャンセル</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="block overflow-hidden">
                      {game.imagePath ? (
                        <img src={`/uploads/${game.imagePath}`} alt={game.name} className="w-full h-72 object-contain bg-[linear-gradient(180deg,rgba(24,24,27,0.82),rgba(9,9,11,0.95))] px-6 transition-all duration-300 ease-out group-hover:opacity-75 group-hover:blur-[2px]" />
                      ) : (
                        <div className="flex h-72 items-center justify-center bg-zinc-800 text-sm text-gray-500">画像なし</div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-xl font-semibold tracking-[0.02em] text-gray-100">
                          {game.name}
                        </span>
                        {admin && (
                          <div className="flex gap-2 ml-2 flex-shrink-0">
                            <button onClick={() => startEdit(game)} className="text-gray-100 hover:text-gray-300 text-sm">編集</button>
                            <button onClick={() => handleDelete(game.id)} className="text-gray-100 hover:text-gray-300 text-sm">削除</button>
                          </div>
                        )}
                      </div>
                      {game.description && <p className="min-h-[2.8rem] text-sm leading-6 text-gray-400 line-clamp-2">{game.description}</p>}
                      {!game.description && <div className="min-h-[2.8rem]" />}
                      <div className="mt-3 space-y-2">
                        <Link
                          to={`/catalog?gameId=${game.id}`}
                          className={primaryActionClass}
                        >
                          目録を見る
                        </Link>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <Link
                            to={`/items?gameId=${game.id}`}
                            className={secondaryActionClass}
                          >
                            アイテム図録を見る
                          </Link>
                          <Link
                            to={`/bosses?gameId=${game.id}`}
                            className={secondaryActionClass}
                          >
                            ボス図録を見る
                          </Link>
                          <Link
                            to={`/npcs?gameId=${game.id}`}
                            className={secondaryActionClass}
                          >
                            NPC図録を見る
                          </Link>
                          <Link
                            to={`/games/${game.id}`}
                            className={secondaryActionClass}
                          >
                            ゲーム詳細を見る
                          </Link>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 関連ニュース */}
      {(newsLoading || news.length > 0) && (
        <section className="mt-14 w-full">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-2">
              <p className="text-xs font-medium tracking-[0.2em] text-zinc-500">NEWS</p>
              <h2 className="text-xl font-semibold text-gray-200 sm:text-2xl">関連ニュース</h2>
            </div>
            {!newsLoading && news.length > 0 && (
              <Link to="/news" className="text-gray-100 hover:underline text-sm">
                関連ニュース一覧へ →
              </Link>
            )}
          </div>
          {newsLoading ? (
            <p className="text-gray-500 text-sm">読み込み中...</p>
          ) : (
            <ul className="space-y-2">
              {news.map((item, i) => (
                <li key={i} className="rounded-xl border border-zinc-800 bg-zinc-900/85 px-4 py-3 shadow-lg">
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
        </section>
      )}
    </div>
  )
}
