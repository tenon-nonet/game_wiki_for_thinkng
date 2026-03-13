import { useEffect, useId, useRef, useState } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import { getNpc, getGames, getTags, createTag, createNpc, updateNpc, analyzeImageText } from '../api'
import { isAdmin } from '../auth'
import { defaultDialogueLabel, parseDialogueLines, serializeDialogueEntries, type DialogueEntry } from '../dialogues'
import type { Game, Tag } from '../types'

export default function NpcFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isEdit = !!id
  const admin = isAdmin()
  const fileInputId = useId()
  const fromCatalog = searchParams.get('from') === 'catalog'
  const fromEncyclopedia = searchParams.get('from') === 'npcs'
  const catalogGameId = searchParams.get('gameId')
  const catalogTab = searchParams.get('tab') ?? 'NPC'
  const detailReturnQuery = fromCatalog
    ? `?from=catalog${catalogGameId ? `&gameId=${catalogGameId}` : ''}&tab=${catalogTab}`
    : fromEncyclopedia
      ? '?from=npcs'
      : ''

  const initialGameLoaded = useRef(false)
  const [games, setGames] = useState<Game[]>([])
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [form, setForm] = useState({
    name: searchParams.get('name') ?? '',
    description: '',
    gameId: searchParams.get('gameId') ?? '',
  })
  const [dialogues, setDialogues] = useState<DialogueEntry[]>([
    { label: defaultDialogueLabel(0), text: '' },
  ])
  const [selectedTags, setSelectedTags] = useState<Set<number>>(new Set())
  const [newTag, setNewTag] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [existingImage, setExistingImage] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [analyzing, setAnalyzing] = useState(false)

  useEffect(() => {
    getGames().then((r) => setGames(r.data))
    if (isEdit) {
      getNpc(Number(id)).then((r) => {
        const npc = r.data
        setForm({
          name: npc.name,
          description: npc.description || '',
          gameId: String(npc.gameId),
        })
        setExistingImage(npc.imagePath)
        setDialogues(parseDialogueLines(npc.dialogues))
        getTags(npc.gameId, 'NPC').then((r2) => {
          setAllTags(r2.data)
          setSelectedTags(new Set(npc.tags.map((t) => t.id)))
        })
      })
    }
  }, [id])

  useEffect(() => {
    if (!form.gameId) return
    if (isEdit && !initialGameLoaded.current) {
      initialGameLoaded.current = true
      return
    }
    setAllTags([])
    setSelectedTags(new Set())
    getTags(Number(form.gameId), 'NPC').then((r) => setAllTags(r.data))
  }, [form.gameId])

  const toggleTag = (id: number) => {
    setSelectedTags((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const addNewTag = async () => {
    const name = newTag.trim()
    if (!name || !form.gameId) return
    try {
      const res = await createTag(name, Number(form.gameId), 'NPC')
      setAllTags((prev) => [...prev, res.data])
      setSelectedTags((prev) => new Set(prev).add(res.data.id))
      setNewTag('')
    } catch {
      setError('タグの作成に失敗しました（同名のタグが既に存在する可能性があります）')
    }
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setImage(file)
    if (file) {
      setPreview(URL.createObjectURL(file))
      setAnalyzing(true)
      try {
        const res = await analyzeImageText(file)
        const extracted = res.data.text.trim()
        if (extracted) {
          setDialogues((prev) => (
            prev.some((entry) => entry.text.trim())
              ? prev
              : [{ label: defaultDialogueLabel(0), text: extracted }]
          ))
        }
      } catch (err: any) {
        const msg = err.response?.data?.error || err.message || '不明なエラー'
        setError('画像解析に失敗しました: ' + msg)
      } finally {
        setAnalyzing(false)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const data = new FormData()
    const json = JSON.stringify({
      name: form.name,
      description: form.description,
      gameId: Number(form.gameId),
      tags: Array.from(selectedTags).map((id) => allTags.find((t) => t.id === id)?.name).filter(Boolean),
      dialogues: serializeDialogueEntries(dialogues),
    })
    data.append('data', new Blob([json], { type: 'application/json' }))
    if (image) data.append('image', image)

    try {
      if (isEdit) {
        await updateNpc(Number(id), data)
        navigate(`/npcs/${id}${detailReturnQuery}`)
      } else {
        const res = await createNpc(data)
        navigate(`/npcs/${res.data.id}`)
      }
    } catch (err: any) {
      setError(err.response?.data?.error || '保存に失敗しました')
    }
  }

  if (!isEdit && (!form.name || !form.gameId)) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link to="/npcs" className="text-gray-100 hover:underline text-sm">← NPC一覧</Link>
        <div className="bg-zinc-800 rounded-lg shadow p-6 mt-4 text-center space-y-4">
          <p className="text-gray-300">NPCは目録から登録してください。</p>
          <Link to="/catalog" className="inline-block bg-red-900 hover:bg-red-800 text-white px-4 py-2 rounded text-sm">
            目録へ
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4">
        <Link to="/npcs" className="text-gray-100 hover:underline text-sm">← NPC一覧</Link>
        {!isEdit && <Link to={`/catalog${form.gameId ? `?gameId=${form.gameId}&tab=NPC` : ''}`} className="text-gray-400 hover:underline text-sm">← 目録</Link>}
      </div>

      <div className="bg-zinc-800 rounded-lg shadow p-6 mt-4">
        <h1 className="text-xl font-bold text-gray-100 mb-6">
          {isEdit ? 'NPC編集' : 'NPC追加'}
        </h1>

        {error && <p className="text-gray-100 text-sm mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">NPC名 *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="w-full border border-gray-600 rounded px-3 py-2 bg-zinc-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">ゲーム *</label>
            <select
              value={form.gameId}
              onChange={(e) => setForm({ ...form, gameId: e.target.value })}
              required
              className="w-full border border-gray-600 rounded px-3 py-2 bg-zinc-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-800"
            >
              <option value="">選択してください</option>
              {games.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              画像
              <span className="ml-2 text-xs text-gray-100 font-normal">
                添付すると画像解析して説明欄に自動入力されますが、結構間違えますので校閲お願いします
              </span>
            </label>
            {(preview || existingImage) && (
              <img
                src={preview || `/uploads/${existingImage}`}
                alt="preview"
                className="w-full max-w-[32rem] max-h-[24rem] object-contain rounded mb-3 border border-gray-600 bg-zinc-900"
              />
            )}
            <div className="rounded border border-dashed border-gray-500 bg-zinc-900/60 px-3 py-3">
              <input
                id={fileInputId}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <div className="flex items-center gap-3">
                <label
                  htmlFor={fileInputId}
                  className="inline-flex items-center rounded border border-zinc-500/70 bg-zinc-900 px-3 py-1.5 text-sm text-gray-100 hover:bg-zinc-800 transition cursor-pointer"
                >
                  ファイルを選択
                </label>
                <span className="text-sm text-gray-300 truncate">
                  {image?.name || '未選択'}
                </span>
              </div>
              <p className="mt-2 text-xs text-gray-400">JPG / PNG などの画像を選択</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              説明
              {analyzing && (
                <span className="ml-2 text-xs text-gray-100 animate-pulse">
                  画像からテキストを解析中...
                </span>
              )}
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              disabled={analyzing}
              placeholder={analyzing ? '解析中...' : ''}
              className="w-full border border-gray-600 rounded px-3 py-2 bg-zinc-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-800 disabled:bg-zinc-800 disabled:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">セリフ</label>
            <div className="space-y-2">
              {dialogues.map((d, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <input
                    type="text"
                    value={d.label}
                    onChange={(e) => {
                      const next = [...dialogues]
                      next[i] = { ...next[i], label: e.target.value }
                      setDialogues(next)
                    }}
                    className="w-24 shrink-0 border border-gray-600 rounded px-2 py-2 bg-zinc-700 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-800"
                    placeholder={defaultDialogueLabel(i)}
                  />
                  <textarea
                    value={d.text}
                    onChange={(e) => {
                      const next = [...dialogues]
                      next[i] = { ...next[i], text: e.target.value }
                      setDialogues(next)
                    }}
                    rows={5}
                    className="flex-1 border border-gray-600 rounded px-3 py-2 bg-zinc-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-800 text-sm"
                    placeholder={defaultDialogueLabel(i)}
                  />
                  {dialogues.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setDialogues(dialogues.filter((_, j) => j !== i))}
                      className="text-gray-500 hover:text-red-400 text-lg mt-1"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setDialogues([...dialogues, { label: defaultDialogueLabel(dialogues.length), text: '' }])}
              className="mt-2 text-sm text-gray-400 hover:text-gray-200 border border-gray-600 rounded px-3 py-1 hover:border-gray-400 transition"
            >
              ＋ セリフを追加
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">タグ</label>
            {!form.gameId ? (
              <p className="text-gray-500 text-xs">ゲームを選択するとタグが表示されます</p>
            ) : allTags.length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-3">
                {allTags.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTag(t.id)}
                    className={`px-3 py-1 rounded-full text-sm border transition ${
                      selectedTags.has(t.id)
                        ? 'bg-red-900 border-red-800 text-white'
                        : 'bg-zinc-700 border-gray-600 text-gray-300 hover:border-red-800'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-xs mb-2">このゲームにタグはありません</p>
            )}
            {admin && form.gameId && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addNewTag() } }}
                  placeholder="新規タグを追加"
                  className="flex-1 border border-gray-600 rounded px-3 py-1.5 text-sm bg-zinc-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-800"
                />
                <button
                  type="button"
                  onClick={addNewTag}
                  className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1.5 rounded text-sm"
                >
                  追加
                </button>
              </div>
            )}
            {selectedTags.size > 0 && (
              <p className="text-xs text-gray-400 mt-2">
                選択中: {Array.from(selectedTags).map((id) => allTags.find((t) => t.id === id)?.name).filter(Boolean).join(', ')}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={analyzing}
              className="bg-red-900 hover:bg-red-800 text-white px-6 py-2 rounded font-medium disabled:opacity-50"
            >
              {isEdit ? '更新する' : '追加する'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="bg-zinc-700 hover:bg-gray-600 text-gray-200 px-4 py-2 rounded"
            >
              キャンセル
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
