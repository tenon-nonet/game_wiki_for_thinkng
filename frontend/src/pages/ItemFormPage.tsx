import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import { getItem, getGames, getTags, getTagAttributes, createItem, updateItem, analyzeImageText } from '../api'
import type { Game, Tag, TagAttribute } from '../types'

export default function ItemFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isEdit = !!id

  const [games, setGames] = useState<Game[]>([])
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [attributes, setAttributes] = useState<TagAttribute[]>([])
  const [form, setForm] = useState({
    name: searchParams.get('name') ?? '',
    description: '',
    gameId: searchParams.get('gameId') ?? '',
    category: searchParams.get('category') ?? '',
  })
  // 属性ごとに選択中タグID (max 1 per attribute)
  const [selectedByAttr, setSelectedByAttr] = useState<Record<string, number | null>>({})
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [existingImage, setExistingImage] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [analyzing, setAnalyzing] = useState(false)

  const initSelection = (tags: Tag[], attrs: TagAttribute[]) => {
    const byAttr: Record<string, number | null> = {}
    attrs.forEach((a) => { byAttr[a.name] = null })
    tags.forEach((t) => {
      if (t.attribute && t.attribute in byAttr) {
        byAttr[t.attribute] = t.id
      }
    })
    setSelectedByAttr(byAttr)
  }

  useEffect(() => {
    getGames().then((r) => setGames(r.data))
    if (isEdit) {
      getItem(Number(id)).then((r) => {
        const item = r.data
        setForm({
          name: item.name,
          description: item.description || '',
          gameId: String(item.gameId),
          category: item.category || '',
        })
        setExistingImage(item.imagePath)
        Promise.all([
          getTags(item.gameId),
          getTagAttributes(item.gameId),
        ]).then(([tagsRes, attrsRes]) => {
          setAllTags(tagsRes.data)
          setAttributes(attrsRes.data)
          initSelection(item.tags, attrsRes.data)
        })
      })
    }
  }, [id])

  useEffect(() => {
    if (form.gameId && !isEdit) {
      setAllTags([])
      setAttributes([])
      setSelectedByAttr({})
      Promise.all([
        getTags(Number(form.gameId)),
        getTagAttributes(Number(form.gameId)),
      ]).then(([tagsRes, attrsRes]) => {
        setAllTags(tagsRes.data)
        setAttributes(attrsRes.data)
        const byAttr: Record<string, number | null> = {}
        attrsRes.data.forEach((a: TagAttribute) => { byAttr[a.name] = null })
        setSelectedByAttr(byAttr)
      })
    }
  }, [form.gameId])

  const toggleAttrTag = (attrName: string, tagId: number) => {
    setSelectedByAttr((prev) => ({
      ...prev,
      [attrName]: tagId === 0 ? null : tagId,
    }))
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
          setForm((prev) => (
            prev.description.trim()
              ? prev
              : { ...prev, description: extracted }
          ))
        }
      } catch (err: unknown) {
        const e = err as { response?: { data?: { error?: string } }; message?: string }
        setError('画像解析に失敗しました: ' + (e.response?.data?.error || e.message || '不明なエラー'))
      } finally {
        setAnalyzing(false)
      }
    }
  }

  const collectSelectedTagNames = () => {
    const ids = Object.values(selectedByAttr).filter((v): v is number => v !== null)
    return ids.map((id) => allTags.find((t) => t.id === id)?.name).filter(Boolean) as string[]
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const data = new FormData()
    const json = JSON.stringify({
      name: form.name,
      description: form.description,
      gameId: Number(form.gameId),
      category: form.category || null,
      tags: collectSelectedTagNames(),
    })
    data.append('data', new Blob([json], { type: 'application/json' }))
    if (image) data.append('image', image)

    try {
      if (isEdit) {
        await updateItem(Number(id), data)
        navigate(`/items/${id}`)
      } else {
        const res = await createItem(data)
        navigate(`/items/${res.data.id}`)
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error || '保存に失敗しました')
    }
  }

  // タグを属性ごとにグループ化（属性ありのみ）
  const tagsByAttr: { attrName: string; tags: Tag[] }[] = attributes.map((a) => ({
    attrName: a.name,
    tags: allTags.filter((t) => t.attribute === a.name),
  }))
  const hasAnyAttrTags = tagsByAttr.some(({ tags }) => tags.length > 0)

  // 新規作成時は目録経由（name + gameId）が必須
  if (!isEdit && (!form.name || !form.gameId)) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link to="/items" className="text-gray-100 hover:underline text-sm">← アイテム一覧</Link>
        <div className="bg-zinc-800 rounded-lg shadow p-6 mt-4 text-center space-y-4">
          <p className="text-gray-300">アイテムは目録から登録してください。</p>
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
        <Link to="/items" className="text-gray-100 hover:underline text-sm">← アイテム一覧</Link>
        {!isEdit && <Link to={`/catalog${form.gameId ? `?gameId=${form.gameId}&tab=ITEM` : ''}`} className="text-gray-400 hover:underline text-sm">← 目録</Link>}
      </div>

      <div className="bg-zinc-800 rounded-lg shadow p-6 mt-4">
        <h1 className="text-xl font-bold text-gray-100 mb-6">
          {isEdit ? 'アイテム編集' : 'アイテム追加'}
        </h1>

        {error && <p className="text-gray-100 text-sm mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">アイテム名 *</label>
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
            <label className="block text-sm font-medium text-gray-200 mb-1">カテゴリ</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full border border-gray-600 rounded px-3 py-2 bg-zinc-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-800"
            >
              <option value="">未分類</option>
              <option value="武器">武器</option>
              <option value="防具">防具</option>
              <option value="消費アイテム">消費アイテム</option>
              <option value="素材">素材</option>
              <option value="タリスマン">タリスマン</option>
              <option value="その他">その他</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              画像
              <span className="ml-2 text-xs text-gray-100 font-normal">
                添付すると自動で文字を入力しますが、結構間違えます
              </span>
            </label>
            {(preview || existingImage) && (
              <img
                src={preview || `/uploads/${existingImage}`}
                alt="preview"
                className="w-40 h-40 object-cover rounded mb-2 border border-gray-600"
              />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="text-sm text-gray-400"
            />
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

          {/* タグ選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">タグ</label>
            {!form.gameId ? (
              <p className="text-gray-500 text-xs">ゲームを選択するとタグが表示されます</p>
            ) : !hasAnyAttrTags ? (
              <p className="text-gray-500 text-xs">このゲームに選択できるタグはありません</p>
            ) : (
              <div className="space-y-2">
                {tagsByAttr.map(({ attrName, tags }) => (
                  tags.length === 0 ? null : (
                    <div key={attrName} className="flex items-center gap-3">
                      <label className="text-xs text-gray-400 w-20 shrink-0">{attrName}</label>
                      <select
                        value={selectedByAttr[attrName] ?? ''}
                        onChange={(e) => toggleAttrTag(attrName, Number(e.target.value))}
                        className="flex-1 border border-gray-600 rounded px-2 py-1.5 text-sm bg-zinc-700 text-gray-100 focus:outline-none focus:ring-1 focus:ring-red-800"
                      >
                        <option value="">未選択</option>
                        {tags.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                  )
                ))}
              </div>
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
