import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getItem, getGames, createItem, updateItem, analyzeImageText } from '../api'
import type { Game } from '../types'

export default function ItemFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = !!id

  const [games, setGames] = useState<Game[]>([])
  const [form, setForm] = useState({ name: '', description: '', gameId: '', tags: '' })
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [existingImage, setExistingImage] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [analyzing, setAnalyzing] = useState(false)

  useEffect(() => {
    getGames().then((r) => setGames(r.data))
    if (isEdit) {
      getItem(Number(id)).then((r) => {
        const item = r.data
        setForm({
          name: item.name,
          description: item.description || '',
          gameId: String(item.gameId),
          tags: item.tags.map((t) => t.name).join(', '),
        })
        setExistingImage(item.imagePath)
      })
    }
  }, [id])

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
          setForm((prev) => ({ ...prev, description: extracted }))
        }
      } catch {
        // 解析失敗は無視してそのまま続行
      } finally {
        setAnalyzing(false)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const tagList = form.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    const data = new FormData()
    const json = JSON.stringify({
      name: form.name,
      description: form.description,
      gameId: Number(form.gameId),
      tags: tagList,
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
    } catch (err: any) {
      setError(err.response?.data?.error || '保存に失敗しました')
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link to="/items" className="text-indigo-400 hover:underline text-sm">← アイテム一覧</Link>

      <div className="bg-gray-800 rounded-lg shadow p-6 mt-4">
        <h1 className="text-xl font-bold text-gray-100 mb-6">
          {isEdit ? 'アイテム編集' : 'アイテム追加'}
        </h1>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">アイテム名 *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="w-full border border-gray-600 rounded px-3 py-2 bg-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">ゲーム *</label>
            <select
              value={form.gameId}
              onChange={(e) => setForm({ ...form, gameId: e.target.value })}
              required
              className="w-full border border-gray-600 rounded px-3 py-2 bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              <span className="ml-2 text-xs text-indigo-400 font-normal">
                ※ 画像を選択するとテキストを自動抽出して説明欄に入力します
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
                <span className="ml-2 text-xs text-indigo-400 animate-pulse">
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
              className="w-full border border-gray-600 rounded px-3 py-2 bg-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-800 disabled:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              タグ（カンマ区切り）
            </label>
            <input
              type="text"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="例: 武器, レア, 強化"
              className="w-full border border-gray-600 rounded px-3 py-2 bg-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={analyzing}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded font-medium disabled:opacity-50"
            >
              {isEdit ? '更新する' : '追加する'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="bg-gray-700 hover:bg-gray-600 text-gray-200 px-4 py-2 rounded"
            >
              キャンセル
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
