import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '../api'
import { saveAuth } from '../auth'
import MessageOverlay from '../components/MessageOverlay'
import { usePageMeta } from '../seo'

export default function RegisterPage() {
  usePageMeta({
    title: '新規登録 | FROMDEX.com',
    description: 'FROMDEX.com の新規登録ページ。登録するとマイページで自分の編集記録やメッセージ記録を確認できます。',
  })

  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [pendingAuth, setPendingAuth] = useState<{ token: string; username: string; role: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const res = await register(form.username, form.password)
      setPendingAuth({
        token: res.data.token,
        username: res.data.username,
        role: res.data.role,
      })
      setShowSuccess(true)
    } catch (err: any) {
      const msg = err.response?.data?.error || '登録に失敗しました'
      setError(msg)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      {showSuccess && (
        <MessageOverlay
          message="登録完了しました"
          onClose={() => {
            setShowSuccess(false)
            if (pendingAuth) {
              saveAuth(pendingAuth.token, pendingAuth.username, pendingAuth.role)
              setPendingAuth(null)
            }
            navigate('/')
          }}
        />
      )}
      <div className="bg-zinc-800 rounded-lg shadow p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-gray-100">新規登録</h1>
        {error && <p className="text-gray-100 text-sm mb-4">{error}</p>}
        <p className="text-gray-100 text-sm mb-4">ログインするとマイページが追加され、自分の編集記録やメッセージ記録が確認できてうれしい。それだけです、、、よかったら登録してね</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">ユーザー名</label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
              minLength={3}
              className="w-full border border-gray-600 rounded px-3 py-2 bg-zinc-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">パスワード</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={6}
              className="w-full border border-gray-600 rounded px-3 py-2 bg-zinc-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-800"
            />
          </div>
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-md border border-amber-400/70 bg-gradient-to-b from-amber-300/30 via-amber-500/20 to-transparent px-5 py-2.5 text-base font-semibold tracking-[0.1em] text-amber-50 shadow-[0_0_28px_rgba(245,158,11,0.18)] transition hover:border-amber-300/90 hover:bg-amber-300/24 hover:text-white"
          >
            登録
          </button>
        </form>
        <p className="mt-4 text-sm text-gray-400 text-center">
          すでに登録しているなら{' '}
          <Link to="/login" className="text-gray-100 hover:underline">ログイン</Link>
        </p>
      </div>
    </div>
  )
}
