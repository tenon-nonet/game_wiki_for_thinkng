import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import JSZip from 'jszip'
import { getGames, getTags, analyzeImageText, createItem } from '../api'
import type { Game, Tag } from '../types'

interface Entry {
  file: File
  previewUrl: string
  name: string
  description: string
  analyzing: boolean
  error: string
}

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

export default function BulkImportPage() {
  const navigate = useNavigate()
  const [games, setGames] = useState<Game[]>([])
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [gameId, setGameId] = useState('')
  const [selectedTags, setSelectedTags] = useState<Set<number>>(new Set())
  const [entries, setEntries] = useState<Entry[]>([])
  const [phase, setPhase] = useState<'setup' | 'review' | 'importing' | 'done'>('setup')
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 })
  const [globalError, setGlobalError] = useState('')

  useEffect(() => {
    getGames().then((r) => setGames(r.data))
  }, [])

  useEffect(() => {
    if (gameId) {
      setSelectedTags(new Set())
      getTags(Number(gameId)).then((r) => setAllTags(r.data))
    } else {
      setAllTags([])
    }
  }, [gameId])

  const toggleTag = (id: number) => {
    setSelectedTags((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleZipChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setGlobalError('')
    setEntries([])

    try {
      const zip = await JSZip.loadAsync(file)
      const imageFiles: Entry[] = []

      for (const [filename, zipEntry] of Object.entries(zip.files)) {
        if (zipEntry.dir) continue
        const ext = filename.split('.').pop()?.toLowerCase()
        const mimeMap: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp' }
        const mime = mimeMap[ext || '']
        if (!mime) continue

        const blob = await zipEntry.async('blob')
        const imageFile = new File([blob], filename.split('/').pop() || filename, { type: mime })
        const baseName = (filename.split('/').pop() || filename).replace(/\.[^.]+$/, '')

        imageFiles.push({
          file: imageFile,
          previewUrl: URL.createObjectURL(imageFile),
          name: baseName,
          description: '',
          analyzing: false,
          error: '',
        })
      }

      if (imageFiles.length === 0) {
        setGlobalError('ZIPに画像ファイルが見つかりませんでした（対応形式: jpg, png, gif, webp）')
        return
      }

      setEntries(imageFiles)
    } catch {
      setGlobalError('ZIPファイルの読み込みに失敗しました')
    }
  }

  const analyzeAll = async () => {
    if (!gameId) {
      setGlobalError('ゲームを選択してください')
      return
    }
    setGlobalError('')
    setPhase('review')

    for (let i = 0; i < entries.length; i++) {
      setEntries((prev) => prev.map((e, idx) => idx === i ? { ...e, analyzing: true, error: '' } : e))
      try {
        const res = await analyzeImageText(entries[i].file)
        const text = res.data.text.trim()
        setEntries((prev) => prev.map((e, idx) => idx === i ? { ...e, analyzing: false, description: text } : e))
      } catch (err: any) {
        const msg = err.response?.data?.error || err.message || '解析失敗'
        setEntries((prev) => prev.map((e, idx) => idx === i ? { ...e, analyzing: false, error: msg } : e))
      }
    }
  }

  const removeEntry = (index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index))
  }

  const updateEntry = (index: number, field: 'name' | 'description', value: string) => {
    setEntries((prev) => prev.map((e, i) => i === index ? { ...e, [field]: value } : e))
  }

  const importAll = async () => {
    const validEntries = entries.filter((e) => e.name.trim())
    setPhase('importing')
    setImportProgress({ current: 0, total: validEntries.length })

    const tagNames = Array.from(selectedTags).map((id) => allTags.find((t) => t.id === id)?.name).filter(Boolean) as string[]

    for (let i = 0; i < validEntries.length; i++) {
      const entry = validEntries[i]
      const data = new FormData()
      const json = JSON.stringify({ name: entry.name.trim(), description: entry.description, gameId: Number(gameId), tags: tagNames })
      data.append('data', new Blob([json], { type: 'application/json' }))
      data.append('image', entry.file)
      try {
        await createItem(data)
      } catch {
        // 失敗しても続行
      }
      setImportProgress({ current: i + 1, total: validEntries.length })
    }

    setPhase('done')
  }

  const analyzingCount = entries.filter((e) => e.analyzing).length
  const allAnalyzed = phase === 'review' && analyzingCount === 0

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/items" className="text-gray-100 hover:underline text-sm">← アイテム一覧</Link>

      <div className="bg-zinc-800 rounded-lg shadow p-6 mt-4">
        <h1 className="text-xl font-bold text-gray-100 mb-6">画像一括取り込み</h1>

        {globalError && <p className="text-gray-100 text-sm mb-4">{globalError}</p>}

        {phase === 'done' ? (
          <div className="text-center py-8">
            <p className="text-green-400 text-lg font-semibold mb-4">✓ {importProgress.total}件のアイテムを登録しました</p>
            <button onClick={() => navigate('/items')} className="bg-red-900 hover:bg-red-800 text-white px-6 py-2 rounded">
              アイテム一覧へ
            </button>
          </div>
        ) : phase === 'importing' ? (
          <div className="text-center py-8">
            <p className="text-gray-200 text-lg mb-2">登録中... {importProgress.current} / {importProgress.total}</p>
            <div className="w-full bg-zinc-700 rounded-full h-2 mt-4">
              <div
                className="bg-red-800 h-2 rounded-full transition-all"
                style={{ width: `${importProgress.total ? (importProgress.current / importProgress.total) * 100 : 0}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            {/* 設定エリア */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">ZIPファイル *</label>
                <input
                  type="file"
                  accept=".zip"
                  onChange={handleZipChange}
                  disabled={phase === 'review'}
                  className="text-sm text-gray-400 disabled:opacity-50"
                />
                {entries.length > 0 && (
                  <p className="text-xs text-gray-100 mt-1">{entries.length}件の画像を検出</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">ゲーム *（全アイテム共通）</label>
                <select
                  value={gameId}
                  onChange={(e) => setGameId(e.target.value)}
                  disabled={phase === 'review'}
                  className="border border-gray-600 rounded px-3 py-2 bg-zinc-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-800 disabled:opacity-50"
                >
                  <option value="">選択してください</option>
                  {games.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">タグ（全アイテム共通・任意）</label>
                <div className="flex flex-wrap gap-2">
                  {allTags.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      disabled={phase === 'review'}
                      onClick={() => toggleTag(t.id)}
                      className={`px-3 py-1 rounded-full text-sm border transition disabled:opacity-50 ${
                        selectedTags.has(t.id)
                          ? 'bg-red-900 border-red-800 text-white'
                          : 'bg-zinc-700 border-gray-600 text-gray-300 hover:border-red-800'
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>

              {phase === 'setup' && entries.length > 0 && (
                <button
                  onClick={analyzeAll}
                  className="bg-red-900 hover:bg-red-800 text-white px-6 py-2 rounded font-medium"
                >
                  解析開始
                </button>
              )}
            </div>

            {/* 解析結果一覧 */}
            {phase === 'review' && entries.length > 0 && (
              <>
                {analyzingCount > 0 && (
                  <p className="text-gray-100 text-sm animate-pulse mb-4">
                    解析中... ({entries.length - analyzingCount}/{entries.length} 完了)
                  </p>
                )}

                <div className="space-y-4 mb-6 max-h-[60vh] overflow-y-auto pr-1">
                  {entries.map((entry, i) => (
                    <div key={i} className="bg-zinc-700 rounded-lg p-4 flex gap-4">
                      <img src={entry.previewUrl} alt={entry.name} className="w-24 h-24 object-cover rounded flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <input
                            type="text"
                            value={entry.name}
                            onChange={(e) => updateEntry(i, 'name', e.target.value)}
                            placeholder="アイテム名 *"
                            className="flex-1 border border-gray-600 rounded px-2 py-1 bg-zinc-800 text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-800"
                          />
                          <button onClick={() => removeEntry(i)} className="text-gray-100 hover:text-gray-300 text-xs flex-shrink-0">
                            削除
                          </button>
                        </div>
                        {entry.analyzing ? (
                          <p className="text-gray-100 text-xs animate-pulse">解析中...</p>
                        ) : entry.error ? (
                          <p className="text-gray-100 text-xs">{entry.error}</p>
                        ) : null}
                        <textarea
                          value={entry.description}
                          onChange={(e) => updateEntry(i, 'description', e.target.value)}
                          rows={3}
                          placeholder="説明（自動抽出）"
                          className="w-full border border-gray-600 rounded px-2 py-1 bg-zinc-800 text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-red-800 resize-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {allAnalyzed && (
                  <div className="flex gap-3">
                    <button
                      onClick={importAll}
                      disabled={entries.filter((e) => e.name.trim()).length === 0}
                      className="bg-red-900 hover:bg-red-800 text-white px-6 py-2 rounded font-medium disabled:opacity-40"
                    >
                      {entries.filter((e) => e.name.trim()).length}件を一括登録
                    </button>
                    <button
                      onClick={() => { setPhase('setup'); setEntries([]) }}
                      className="bg-zinc-700 hover:bg-gray-600 text-gray-200 px-4 py-2 rounded"
                    >
                      やり直す
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
