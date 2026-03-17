import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { getAdminUsers } from '../api'
import { isAdmin } from '../auth'

const STORAGE_KEY = 'adminUsersLastViewed'

type AdminUser = { id: number; username: string; role: string; createdAt: string }

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getAdminUsers()
      .then((res) => setUsers(res.data))
      .catch(() => setError('ユーザー一覧の取得に失敗しました'))
      .finally(() => {
        setLoading(false)
        localStorage.setItem(STORAGE_KEY, Date.now().toString())
        window.dispatchEvent(new Event('adminUsersViewed'))
      })
  }, [])

  if (!isAdmin()) return <Navigate to="/" replace />

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-8 sm:py-10">
      <div className="mb-6 space-y-2">
        <Link to="/" className="text-sm text-gray-400 hover:text-gray-200">← トップページ</Link>
        <h1 className="text-2xl font-bold text-gray-100 sm:text-3xl">ユーザー一覧</h1>
      </div>

      {error && <p className="mb-4 text-sm text-red-300">{error}</p>}

      {loading ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 text-sm text-gray-400">読み込み中...</div>
      ) : (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-700 text-left text-gray-400">
                <th className="px-4 py-3">ユーザー名</th>
                <th className="px-4 py-3">権限</th>
                <th className="px-4 py-3">登録日時</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-zinc-800 last:border-0 hover:bg-zinc-800/50">
                  <td className="px-4 py-3 text-gray-100">{u.username}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${u.role === 'ADMIN' ? 'bg-amber-500/20 text-amber-300' : 'bg-zinc-700 text-zinc-300'}`}>
                      {u.role === 'ADMIN' ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {new Date(u.createdAt).toLocaleString('ja-JP')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="px-4 py-3 text-xs text-gray-500">合計 {users.length} 名</p>
        </div>
      )}
    </div>
  )
}
