import { useEffect, useState } from 'react'
import { getGames, getGame, getTags, createTag, updateTag, deleteTag, getTagAttributes, createTagAttribute, deleteTagAttribute, updateGameCategories } from '../api'
import type { Game, Tag, TagAttribute } from '../types'

export default function TagsAdminPage() {
  const [games, setGames] = useState<Game[]>([])
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [selectedGameId, setSelectedGameId] = useState<string>('')
  const [tagType, setTagType] = useState<'ITEM' | 'BOSS' | 'NPC'>('ITEM')
  const [tags, setTags] = useState<Tag[]>([])
  const [attributes, setAttributes] = useState<TagAttribute[]>([])
  const [newName, setNewName] = useState('')
  const [newAttribute, setNewAttribute] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editAttribute, setEditAttribute] = useState('')
  const [newAttrName, setNewAttrName] = useState('')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    getGames().then((r) => setGames(r.data))
  }, [])

  useEffect(() => {
    if (selectedGameId) {
      getTags(Number(selectedGameId), tagType).then((r) => setTags(r.data))
      getTagAttributes(Number(selectedGameId)).then((r) => setAttributes(r.data))
      getGame(Number(selectedGameId)).then((r) => setSelectedGame(r.data))
    } else {
      setTags([])
      setAttributes([])
      setSelectedGame(null)
    }
    setEditingId(null)
    setError('')
  }, [selectedGameId, tagType])

  const loadTags = () => getTags(Number(selectedGameId), tagType).then((r) => setTags(r.data))
  const loadAttributes = () => getTagAttributes(Number(selectedGameId)).then((r) => setAttributes(r.data))

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedGameId) return
    setError('')
    try {
      await createTag(newName.trim(), Number(selectedGameId), tagType, newAttribute || undefined)
      setNewName('')
      setNewAttribute('')
      loadTags()
    } catch {
      setError('タグの作成に失敗しました（同名のタグが既に存在する可能性があります）')
    }
  }

  const startEdit = (tag: Tag) => {
    setEditingId(tag.id)
    setEditName(tag.name)
    setEditAttribute(tag.attribute || '')
    setError('')
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId == null) return
    setError('')
    try {
      await updateTag(editingId, editName.trim(), editAttribute || undefined)
      setEditingId(null)
      loadTags()
    } catch {
      setError('タグの更新に失敗しました（同名のタグが既に存在する可能性があります）')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('このタグを削除しますか？\n削除するとアイテム・ボス・NPCからも紐付けが外れます。')) return
    setError('')
    try {
      await deleteTag(id)
      loadTags()
    } catch {
      setError('タグの削除に失敗しました')
    }
  }

  const handleCreateAttr = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedGameId || !newAttrName.trim()) return
    setError('')
    try {
      await createTagAttribute(newAttrName.trim(), Number(selectedGameId))
      setNewAttrName('')
      loadAttributes()
    } catch {
      setError('属性の作成に失敗しました（同名の属性が既に存在する可能性があります）')
    }
  }

  const handleDeleteAttr = async (id: number, name: string) => {
    if (!confirm(`属性「${name}」を削除しますか？\nこの属性が設定されたタグの属性はクリアされません。`)) return
    setError('')
    try {
      await deleteTagAttribute(id)
      loadAttributes()
    } catch {
      setError('属性の削除に失敗しました')
    }
  }

  const attrLabel = (attrValue: string) => attrValue || '未設定'

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedGame || !newCategoryName.trim()) return
    const updated = [...(selectedGame.categories ?? []), newCategoryName.trim()]
    try {
      const res = await updateGameCategories(selectedGame.id, updated)
      setSelectedGame(res.data)
      setNewCategoryName('')
    } catch {
      setError('カテゴリの追加に失敗しました')
    }
  }

  const handleDeleteCategory = async (cat: string) => {
    if (!selectedGame) return
    const updated = (selectedGame.categories ?? []).filter((c) => c !== cat)
    try {
      const res = await updateGameCategories(selectedGame.id, updated)
      setSelectedGame(res.data)
    } catch {
      setError('カテゴリの削除に失敗しました')
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-8 py-6 sm:py-10">
      <h1 className="text-3xl font-bold text-gray-100 mb-8">タグ管理</h1>

      <div className="bg-zinc-800 rounded-lg p-4 mb-6">
        <label className="block text-sm font-medium text-gray-200 mb-2">ゲームを選択</label>
        <select
          value={selectedGameId}
          onChange={(e) => { setSelectedGameId(e.target.value); setEditingId(null); setError('') }}
          className="w-full border border-gray-600 rounded px-3 py-2 bg-zinc-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-800"
        >
          <option value="">選択してください</option>
          {games.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>

      {selectedGameId && (
        <>
          {/* アイテムカテゴリ管理 */}
          <div className="bg-zinc-800 rounded-lg p-4 mb-6">
            <h2 className="text-sm font-semibold text-gray-200 mb-3">アイテムカテゴリ</h2>
            <form onSubmit={handleAddCategory} className="flex gap-2 mb-3">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="新規カテゴリ名（例: 武器、防具）"
                required
                className="flex-1 border border-gray-600 rounded px-3 py-2 text-sm bg-zinc-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-800"
              />
              <button type="submit" className="bg-red-900 hover:bg-red-800 text-white px-4 py-2 rounded text-sm">
                追加
              </button>
            </form>
            {(selectedGame?.categories ?? []).length === 0 ? (
              <p className="text-gray-500 text-xs">カテゴリがまだありません</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(selectedGame?.categories ?? []).map((cat) => (
                  <div key={cat} className="flex items-center gap-1 bg-zinc-700 rounded-full px-3 py-1">
                    <span className="text-sm text-gray-200">{cat}</span>
                    <button
                      onClick={() => handleDeleteCategory(cat)}
                      className="text-zinc-500 hover:text-red-400 text-xs ml-1"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* タグ属性管理 */}
          <div className="bg-zinc-800 rounded-lg p-4 mb-6">
            <h2 className="text-sm font-semibold text-gray-200 mb-3">タグ属性</h2>
            <form onSubmit={handleCreateAttr} className="flex gap-2 mb-3">
              <input
                type="text"
                value={newAttrName}
                onChange={(e) => setNewAttrName(e.target.value)}
                placeholder="新規属性名（例: 組織、ボス、概念）"
                required
                className="flex-1 border border-gray-600 rounded px-3 py-2 text-sm bg-zinc-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-800"
              />
              <button
                type="submit"
                className="bg-red-900 hover:bg-red-800 text-white px-4 py-2 rounded text-sm"
              >
                追加
              </button>
            </form>
            {attributes.length === 0 ? (
              <p className="text-gray-500 text-xs">属性がまだありません</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {attributes.map((attr) => (
                  <div key={attr.id} className="flex items-center gap-1 bg-zinc-700 rounded-full px-3 py-1">
                    <span className="text-sm text-gray-200">{attr.name}</span>
                    <button
                      onClick={() => handleDeleteAttr(attr.id, attr.name)}
                      className="text-zinc-500 hover:text-red-400 text-xs ml-1"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* タイプ切り替えタブ */}
          <div className="flex gap-1 mb-6 bg-zinc-800 rounded-lg p-1 w-fit">
            {(['ITEM', 'BOSS', 'NPC'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTagType(t)}
                className={`px-5 py-2 rounded text-sm font-medium transition ${tagType === t ? 'bg-red-900 text-white' : 'text-gray-400 hover:text-gray-200'}`}
              >
                {t === 'ITEM' ? 'アイテムタグ' : t === 'BOSS' ? 'ボスタグ' : 'NPCタグ'}
              </button>
            ))}
          </div>

          {error && <p className="text-gray-100 text-sm mb-4">{error}</p>}

          {/* タグ追加フォーム */}
          <form onSubmit={handleCreate} className="bg-zinc-800 rounded-lg p-4 mb-6 flex gap-2 items-center">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={`新規${tagType === 'BOSS' ? 'ボス' : tagType === 'NPC' ? 'NPC' : 'アイテム'}タグ名`}
              required
              className="flex-1 border border-gray-600 rounded px-3 py-2 text-sm bg-zinc-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-800"
            />
            <select
              value={newAttribute}
              onChange={(e) => setNewAttribute(e.target.value)}
              className="border border-gray-600 rounded px-3 py-2 text-sm bg-zinc-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-800"
            >
              <option value="">属性なし</option>
              {attributes.map((a) => <option key={a.id} value={a.name}>{a.name}</option>)}
            </select>
            <button
              type="submit"
              className="bg-red-900 hover:bg-red-800 text-white px-4 py-2 rounded text-sm whitespace-nowrap"
            >
              追加
            </button>
          </form>

          {/* タグ一覧 */}
          {tags.length === 0 ? (
            <p className="text-gray-500 text-sm">このゲームに{tagType === 'BOSS' ? 'ボス' : tagType === 'NPC' ? 'NPC' : 'アイテム'}タグはありません</p>
          ) : (
            <ul className="space-y-2">
              {tags.map((tag) => (
                <li key={tag.id} className="bg-zinc-800 rounded-lg px-4 py-3 flex items-center gap-3">
                  {editingId === tag.id ? (
                    <form onSubmit={handleUpdate} className="flex gap-2 flex-1 items-center">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        required
                        className="flex-1 border border-gray-600 rounded px-3 py-1.5 text-sm bg-zinc-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-800"
                      />
                      <select
                        value={editAttribute}
                        onChange={(e) => setEditAttribute(e.target.value)}
                        className="border border-gray-600 rounded px-2 py-1.5 text-sm bg-zinc-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-800"
                      >
                        <option value="">属性なし</option>
                        {attributes.map((a) => <option key={a.id} value={a.name}>{a.name}</option>)}
                      </select>
                      <button type="submit" className="bg-red-900 hover:bg-red-800 text-white px-3 py-1.5 rounded text-sm">保存</button>
                      <button type="button" onClick={() => setEditingId(null)} className="bg-zinc-700 hover:bg-gray-600 text-gray-200 px-3 py-1.5 rounded text-sm">キャンセル</button>
                    </form>
                  ) : (
                    <>
                      <span className="flex-1 text-gray-100 text-sm">{tag.name}</span>
                      {tag.attribute && (
                        <span className="text-xs text-zinc-400 bg-zinc-700 rounded-full px-2 py-0.5">{attrLabel(tag.attribute)}</span>
                      )}
                      <button onClick={() => startEdit(tag)} className="text-gray-100 hover:text-gray-300 text-sm">編集</button>
                      <button onClick={() => handleDelete(tag.id)} className="text-gray-100 hover:text-gray-300 text-sm">削除</button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
