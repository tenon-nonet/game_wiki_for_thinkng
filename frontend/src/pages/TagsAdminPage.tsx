import { useEffect, useState } from 'react'
import { getGames, getTags, createTag, updateTag, deleteTag } from '../api'
import type { Game, Tag } from '../types'

export default function TagsAdminPage() {
  const [games, setGames] = useState<Game[]>([])
  const [selectedGameId, setSelectedGameId] = useState<string>('')
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
      getTags(Number(selectedGameId)).then((r) => setTags(r.data))
    } else {
      setTags([])
    }
  }, [selectedGameId])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedGameId) return
    setError('')
    try {
      await createTag(newName.trim(), Number(selectedGameId))
      setNewName('')
      getTags(Number(selectedGameId)).then((r) => setTags(r.data))
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
      getTags(Number(selectedGameId)).then((r) => setTags(r.data))
    } catch {
      setError('タグの更新に失敗しました（同名のタグが既に存在する可能性があります）')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('このタグを削除しますか？\n削除するとアイテムからも紐付けが外れます。')) return
    setError('')
    try {
      await deleteTag(id)
      getTags(Number(selectedGameId)).then((r) => setTags(r.data))
    } catch {
      setError('タグの削除に失敗しました')
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-100 mb-8">タグ管理</h1>

      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <label className="block text-sm font-medium text-gray-200 mb-2">ゲームを選択</label>
        <select
          value={selectedGameId}
          onChange={(e) => { setSelectedGameId(e.target.value); setEditingId(null); setError('') }}
          className="w-full border border-gray-600 rounded px-3 py-2 bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">選択してください</option>
          {games.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>

      {selectedGameId && (
        <>
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

          <form onSubmit={handleCreate} className="bg-gray-800 rounded-lg p-4 mb-6 flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="新規タグ名"
              required
              className="flex-1 border border-gray-600 rounded px-3 py-2 text-sm bg-gray-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded text-sm"
            >
              追加
            </button>
          </form>

          {tags.length === 0 ? (
            <p className="text-gray-500 text-sm">このゲームにタグはありません</p>
          ) : (
            <ul className="space-y-2">
              {tags.map((tag) => (
                <li key={tag.id} className="bg-gray-800 rounded-lg px-4 py-3 flex items-center gap-3">
                  {editingId === tag.id ? (
                    <form onSubmit={handleUpdate} className="flex gap-2 flex-1">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        required
                        className="flex-1 border border-gray-600 rounded px-3 py-1.5 text-sm bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded text-sm">
                        保存
                      </button>
                      <button type="button" onClick={() => setEditingId(null)} className="bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1.5 rounded text-sm">
                        キャンセル
                      </button>
                    </form>
                  ) : (
                    <>
                      <span className="flex-1 text-gray-100 text-sm">{tag.name}</span>
                      <button onClick={() => startEdit(tag)} className="text-indigo-400 hover:text-indigo-300 text-sm">
                        編集
                      </button>
                      <button onClick={() => handleDelete(tag.id)} className="text-red-400 hover:text-red-300 text-sm">
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
