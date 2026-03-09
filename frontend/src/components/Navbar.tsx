import { Link, useNavigate } from 'react-router-dom'
import { clearAuth, getUsername, isLoggedIn, isAdmin } from '../auth'

export default function Navbar() {
  const navigate = useNavigate()
  const loggedIn = isLoggedIn()

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  return (
    <nav className="bg-gray-900 text-white px-8 py-4 flex items-center justify-between shadow">
      <Link to="/" className="text-2xl font-bold text-indigo-400 hover:text-indigo-300">
        Enlightmenter's Archives 啓蒙の書院
      </Link>
      <div className="flex items-center gap-6">
        <Link to="/items" className="hover:text-indigo-300 text-base">アイテム</Link>
        {loggedIn ? (
          <>
            {isAdmin() && (
              <Link to="/tags" className="hover:text-indigo-300 text-base">タグ管理</Link>
            )}
            <span className="text-gray-400 text-base">{getUsername()}{isAdmin() && ' (Admin)'}</span>
            <button
              onClick={handleLogout}
              className="bg-gray-700 hover:bg-gray-600 text-base px-4 py-1.5 rounded"
            >
              ログアウト
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:text-indigo-300 text-base">ログイン</Link>
            <Link
              to="/register"
              className="bg-indigo-600 hover:bg-indigo-500 text-base px-4 py-1.5 rounded"
            >
              登録
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
