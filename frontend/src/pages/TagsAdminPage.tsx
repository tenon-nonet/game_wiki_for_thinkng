import { useEffect, useState } from 'react'
import { getGames, getTags, createTag, updateTag, deleteTag } from '../api'
import type { Game, Tag } from '../types'

export default function TagsAdminPage() {
  const [games, setGames] = useState<Game[]>([])
  const [selectedGameId, setSelectedGameId] = useState<string>('')
  const [tagType, setTagType] = useState<'ITEM' | 'BOSS' | 'NPC'>('ITEM')
  const [tags, setTags] = useState<Tag[]>([])
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    getGames().then((r) => setGames(r.data))
  }, [])

  useEffect(() => {
    if (selectedGameId) {
      getTags(Number(selectedGameId), tagType).then((r) => setTags(r.data))
    } else {
      setTags([])
    }
    setEditingId(null)
    setError('')
  }, [selectedGameId, tagType])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedGameId) return
    setError('')
    try {
      await createTag(newName.trim(), Number(selectedGameId), tagType)
      setNewName('')
      getTags(Number(selectedGameId), tagType).then((r) => setTags(r.data))
    } catch {
      setError('タグの作成に失敗しました（同名のタグが既に存在する可能性があります）')
    }
  }

  const startEdit = (tag: Tag) => {
    setEditingId(tag.id)
    setEditName(tag.name)
    setError('')
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId == null) return
    setError('')
    try {
      await updateTag(editingId, editName.trim())
      setEditingId(null)
      getTags(Number(selectedGameId), tagType).then((r) => setTags(r.data))
    } catch {
      setError('タグの更新に失敗しました（同名のタグが既に存在する可能性があります）')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('このタグを削除しますか？\n削除するとアイテム・ボス・NPCからも紐付けが外れます。')) return
    setError('')
    try {
      await deleteTag(id)
      getTags(Number(selectedGameId), tagType).then((r) => setTags(r.data))
    } catch {
      setError('タグの削除に失敗しました')
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
          {/* タイプ切り替えタブ */}
          <div className="flex gap-1 mb-6 bg-zinc-800 rounded-lg p-1 w-fit">
            <button
              onClick={() => setTagType('ITEM')}
              className={`px-5 py-2 rounded text-sm font-medium transition ${tagType === 'ITEM' ? 'bg-red-900 text-white' : 'text-gray-400 hover:text-gray-200'}`}
            >
              アイテムタグ
            </button>
            <button
              onClick={() => setTagType('BOSS')}
              className={`px-5 py-2 rounded text-sm font-medium transition ${tagType === 'BOSS' ? 'bg-red-900 text-white' : 'text-gray-400 hover:text-gray-200'}`}
            >
              ボスタグ
            </button>
            <button
              onClick={() => setTagType('NPC')}
              className={`px-5 py-2 rounded text-sm font-medium transition ${tagType === 'NPC' ? 'bg-red-900 text-white' : 'text-gray-400 hover:text-gray-200'}`}
            >
              NPCタグ
            </button>
          </div>

          {error && <p className="text-gray-100 text-sm mb-4">{error}</p>}

          <form onSubmit={handleCreate} className="bg-zinc-800 rounded-lg p-4 mb-6 flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={`新規${tagType === 'BOSS' ? 'ボス' : tagType === 'NPC' ? 'NPC' : 'アイテム'}タグ名`}
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

          {tags.length === 0 ? (
            <p className="text-gray-500 text-sm">このゲームに{tagType === 'BOSS' ? 'ボス' : tagType === 'NPC' ? 'NPC' : 'アイテム'}タグはありません</p>
          ) : (
            <ul className="space-y-2">
              {tags.map((tag) => (
                <li key={tag.id} className="bg-zinc-800 rounded-lg px-4 py-3 flex items-center gap-3">
                  {editingId === tag.id ? (
                    <form onSubmit={handleUpdate} className="flex gap-2 flex-1">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        required
                        className="flex-1 border border-gray-600 rounded px-3 py-1.5 text-sm bg-zinc-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-800"
                      />
                      <button type="submit" className="bg-red-900 hover:bg-red-800 text-white px-3 py-1.5 rounded text-sm">
                        保存
                      </button>
                      <button type="button" onClick={() => setEditingId(null)} className="bg-zinc-700 hover:bg-gray-600 text-gray-200 px-3 py-1.5 rounded text-sm">
                        キャンセル
                      </button>
                    </form>
                  ) : (
                    <>
                      <span className="flex-1 text-gray-100 text-sm">{tag.name}</span>
                      <button onClick={() => startEdit(tag)} className="text-gray-100 hover:text-gray-300 text-sm">
                        編集
                      </button>
                      <button onClick={() => handleDelete(tag.id)} className="text-gray-100 hover:text-gray-300 text-sm">
                        削除
                      </button>
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
