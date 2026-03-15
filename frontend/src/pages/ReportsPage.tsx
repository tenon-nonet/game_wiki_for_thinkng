import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { banReportedAuthor, getBans, getReports, removeBan, updateReportStatus } from '../api'
import { isAdmin } from '../auth'
import { usePageMeta } from '../seo'
import type { Ban, Report } from '../types'

const STATUSES: Report['status'][] = ['NEW', 'CHECKING', 'RESOLVED', 'DISMISSED']

const STATUS_LABELS: Record<Report['status'], string> = {
  NEW: '未確認',
  CHECKING: '確認中',
  RESOLVED: '対応済み',
  DISMISSED: '却下',
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [bans, setBans] = useState<Ban[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  usePageMeta({
    title: '通報管理 | FROMDEX.com',
    description: '掲示板の通報内容を確認し、管理者が対応状況を更新します。',
  })

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const [reportsRes, bansRes] = await Promise.all([getReports(), getBans()])
        setReports(reportsRes.data)
        setBans(bansRes.data)
      } catch (err: any) {
        setError(err.response?.data?.error || '管理情報の取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (!isAdmin()) {
    return <Navigate to="/" replace />
  }

  const handleStatusChange = async (reportId: number, status: Report['status']) => {
    setError('')
    try {
      const res = await updateReportStatus(reportId, status)
      setReports((prev) => prev.map((report) => (report.id === reportId ? res.data : report)))
    } catch (err: any) {
      setError(err.response?.data?.error || '通報ステータスの更新に失敗しました')
    }
  }

  const handleBan = async (reportId: number) => {
    if (!window.confirm('この投稿元をBANします。よろしいですか？')) return
    setError('')
    try {
      const [reportRes, bansRes] = await Promise.all([banReportedAuthor(reportId), getBans()])
      setReports((prev) => prev.map((report) => (report.id === reportId ? reportRes.data : report)))
      setBans(bansRes.data)
    } catch (err: any) {
      setError(err.response?.data?.error || 'BANに失敗しました')
    }
  }

  const handleUnban = async (banId: number) => {
    if (!window.confirm('このBANを解除します。よろしいですか？')) return
    setError('')
    try {
      await removeBan(banId)
      setBans((prev) => prev.filter((ban) => ban.id !== banId))
    } catch (err: any) {
      setError(err.response?.data?.error || 'BAN解除に失敗しました')
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-100">通報管理</h1>
        <p className="mt-2 text-sm text-gray-400">掲示板スレッドと返信への通報、BAN状況を管理します。</p>
      </div>

      {error && <p className="mb-4 text-sm text-red-300">{error}</p>}

      {loading ? (
        <p className="text-sm text-gray-500">読み込み中...</p>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-4 text-lg font-semibold text-gray-100">通報一覧</h2>
            {reports.length === 0 ? (
              <p className="text-sm text-gray-500">通報はありません</p>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <div key={report.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/85 p-5 shadow-lg">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                          <span className="rounded-md border border-zinc-700 px-2 py-1">
                            {report.targetType === 'BOARD_THREAD' ? 'スレッド' : '返信'}
                          </span>
                          <span className="rounded-md border border-amber-700/60 bg-amber-950/30 px-2 py-1 text-amber-200">
                            {STATUS_LABELS[report.status]}
                          </span>
                          <span>{new Date(report.createdAt).toLocaleString('ja-JP')}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-100">{report.targetSummary || '内容なし'}</p>
                          <p className="mt-2 text-sm text-gray-400">通報理由: {report.reason}</p>
                        </div>
                        <div className="grid gap-2 text-xs text-gray-500 sm:grid-cols-2">
                          <p>通報者: {report.reportedBy}</p>
                          <p>対象投稿者: {report.targetAuthor || '不明'}</p>
                          <p>対象ID: {report.targetId}</p>
                          <p>対応者: {report.reviewedBy || '未対応'}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 lg:max-w-[18rem] lg:justify-end">
                        {STATUSES.map((status) => (
                          <button
                            key={status}
                            type="button"
                            disabled={report.status === status}
                            onClick={() => handleStatusChange(report.id, status)}
                            className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-medium text-gray-200 transition hover:border-zinc-500 hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {STATUS_LABELS[status]}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => handleBan(report.id)}
                          className="rounded-md border border-red-800/80 bg-red-950/40 px-3 py-2 text-xs font-medium text-red-200 transition hover:border-red-700 hover:bg-red-950/60"
                        >
                          BAN
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold text-gray-100">BAN一覧</h2>
            {bans.length === 0 ? (
              <p className="text-sm text-gray-500">現在BAN中の投稿元はありません</p>
            ) : (
              <div className="space-y-3">
                {bans.map((ban) => (
                  <div key={ban.id} className="rounded-2xl border border-red-900/50 bg-zinc-900/85 p-4 shadow-lg">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1 text-sm text-gray-300">
                        <p className="font-medium text-gray-100">投稿元キー: {ban.authorKey}</p>
                        <p>理由: {ban.reason}</p>
                        <p className="text-xs text-gray-500">{ban.createdBy} / {new Date(ban.createdAt).toLocaleString('ja-JP')}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUnban(ban.id)}
                        className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-medium text-gray-200 transition hover:border-zinc-500 hover:bg-zinc-700"
                      >
                        BAN解除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}