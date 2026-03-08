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
    <nav className="bg-gray-900 text-white px-6 py-3 flex items-center justify-between shadow">
      <Link to="/" className="text-xl font-bold text-indigo-400 hover:text-indigo-300">
        Enlightmenter's Archives 啓蒙の書院
      </Link>
      <div className="flex items-center gap-4">
        <Link to="/games" className="hover:text-indigo-300 text-sm">ゲーム</Link>
        <Link to="/items" className="hover:text-indigo-300 text-sm">アイテム</Link>
        {loggedIn ? (
          <>
            {isAdmin() && (
              <Link to="/tags" className="hover:text-indigo-300 text-sm">タグ管理</Link>
            )}
            <span className="text-gray-400 text-sm">{getUsername()}{isAdmin() && ' (Admin)'}</span>
            <button
              onClick={handleLogout}
              className="bg-gray-700 hover:bg-gray-600 text-sm px-3 py-1 rounded"
            >
              ログアウト
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:text-indigo-300 text-sm">ログイン</Link>
            <Link
              to="/register"
              className="bg-indigo-600 hover:bg-indigo-500 text-sm px-3 py-1 rounded"
            >
              登録
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
