import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '../api'
import { saveAuth } from '../auth'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const res = await register(form.username, form.password, form.email)
      saveAuth(res.data.token, res.data.username, res.data.role)
      navigate('/')
    } catch (err: any) {
      const msg = err.response?.data?.error || '登録に失敗しました'
      setError(msg)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="bg-zinc-800 rounded-lg shadow p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-gray-100">新規登録</h1>
        {error && <p className="text-gray-100 text-sm mb-4">{error}</p>}
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
            <label className="block text-sm font-medium text-gray-200 mb-1">メールアドレス</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
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
            className="w-full bg-red-900 hover:bg-red-800 text-white font-medium py-2 rounded"
          >
            登録
          </button>
        </form>
        <p className="mt-4 text-sm text-gray-400 text-center">
          すでにアカウントをお持ちの方は{' '}
          <Link to="/login" className="text-gray-100 hover:underline">ログイン</Link>
        </p>
      </div>
    </div>
  )
}
