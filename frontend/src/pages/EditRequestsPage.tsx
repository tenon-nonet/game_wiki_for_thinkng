import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { approveEditRequest, getEditRequests, rejectEditRequest } from '../api'
import { isAdmin } from '../auth'
import { usePageMeta } from '../seo'
import type { EditRequest } from '../types'

export default function EditRequestsPage() {
  usePageMeta({
    title: '編集承認 | FROMDEX.com',
    description: '管理者向けの編集申請承認ページです。',
  })

  const [requests, setRequests] = useState<EditRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [processingId, setProcessingId] = useState<number | null>(null)

  const load = () => {
    setLoading(true)
    getEditRequests()
      .then((res) => setRequests(res.data))
      .catch(() => setError('編集申請一覧の取得に失敗しました'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  if (!isAdmin()) {
    return <Navigate to="/" replace />
  }

  const payloadText = (request: EditRequest) => JSON.stringify(request.payload ?? {}, null, 2)

  const handleApprove = async (id: number) => {
    setProcessingId(id)
    setError('')
    try {
      await approveEditRequest(id)
      load()
    } catch (err: any) {
      setError(err.response?.data?.error || '承認に失敗しました')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (id: number) => {
    const reviewComment = window.prompt('却下理由があれば入力してください', '') ?? ''
    setProcessingId(id)
    setError('')
    try {
      await rejectEditRequest(id, reviewComment || undefined)
      load()
    } catch (err: any) {
      setError(err.response?.data?.error || '却下に失敗しました')
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
      <div className="mb-6 space-y-2">
        <Link to="/" className="text-sm text-gray-400 hover:text-gray-200">← トップページ</Link>
        <h1 className="text-2xl font-bold text-gray-100 sm:text-3xl">編集承認</h1>
      </div>

      {error && <p className="mb-4 text-sm text-red-300">{error}</p>}

      <div className="space-y-4">
        {loading ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 text-sm text-gray-400">読み込み中...</div>
        ) : requests.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 text-sm text-gray-400">承認待ちの編集申請はありません</div>
        ) : (
          requests.map((request) => (
            <div key={request.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg">
              <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
                <span className="rounded bg-amber-500/10 px-2 py-1 text-amber-200">{request.entityType}</span>
                <span className="rounded bg-zinc-800 px-2 py-1 text-zinc-300">{request.actionType}</span>
                <span className="text-gray-300">{request.entityName ?? '名称未設定'}</span>
                {request.gameName && <span className="text-gray-500">/ {request.gameName}</span>}
              </div>

              <p className="mb-3 text-sm text-gray-400">
                申請者: {request.requestedBy} / 申請日時: {new Date(request.createdAt).toLocaleString('ja-JP')}
              </p>

              {request.pendingImagePath && (
                <img
                  src={`/uploads/${request.pendingImagePath}`}
                  alt="pending preview"
                  className="mb-4 max-h-64 rounded border border-zinc-700 bg-zinc-950 object-contain"
                />
              )}

              <pre className="overflow-x-auto rounded border border-zinc-800 bg-black/40 p-3 text-xs leading-6 text-gray-300">
                {payloadText(request)}
              </pre>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => handleApprove(request.id)}
                  disabled={processingId === request.id}
                  className="rounded border border-amber-400/60 bg-amber-300/10 px-4 py-2 text-sm text-amber-100 transition hover:bg-amber-300/20 disabled:opacity-50"
                >
                  承認
                </button>
                <button
                  onClick={() => handleReject(request.id)}
                  disabled={processingId === request.id}
                  className="rounded border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-gray-200 transition hover:border-zinc-500 hover:bg-zinc-800 disabled:opacity-50"
                >
                  却下
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
