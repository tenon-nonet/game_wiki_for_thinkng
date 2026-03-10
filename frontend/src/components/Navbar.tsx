import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { clearAuth, getUsername, isLoggedIn, isAdmin } from '../auth'

export default function Navbar() {
  const navigate = useNavigate()
  const loggedIn = isLoggedIn()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
    setMenuOpen(false)
  }

  return (
    <nav className="bg-zinc-900 text-white shadow">
      <div className="px-4 sm:px-8 py-4 flex items-center justify-between">
        <Link to="/" className="text-lg sm:text-2xl font-bold text-red-700 hover:text-red-600 leading-tight">
          <span className="hidden sm:inline">Archives for Enlightmenters -啓蒙の書院-</span>
          <span className="sm:hidden">-啓蒙の書院-</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/items" className="hover:text-red-600 text-base">アイテム</Link>
          {loggedIn ? (
            <>
              {isAdmin() && (
                <Link to="/tags" className="hover:text-red-600 text-base">タグ管理</Link>
              )}
              <span className="text-gray-400 text-base">{getUsername()}{isAdmin() && ' (Admin)'}</span>
              <button
                onClick={handleLogout}
                className="bg-zinc-700 hover:bg-gray-600 text-base px-4 py-1.5 rounded"
              >
                ログアウト
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-red-600 text-base">ログイン</Link>
              <Link
                to="/register"
                className="bg-red-900 hover:bg-red-800 text-base px-4 py-1.5 rounded"
              >
                登録
              </Link>
            </>
          )}
        </div>

        {/* Hamburger button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 rounded text-gray-300 hover:text-white hover:bg-zinc-700"
          aria-label="メニュー"
        >
          {menuOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-700 px-4 py-3 flex flex-col gap-3">
          <Link to="/items" onClick={() => setMenuOpen(false)} className="hover:text-red-600 py-1">アイテム</Link>
          {loggedIn ? (
            <>
              {isAdmin() && (
                <Link to="/tags" onClick={() => setMenuOpen(false)} className="hover:text-red-600 py-1">タグ管理</Link>
              )}
              <span className="text-gray-400 py-1">{getUsername()}{isAdmin() && ' (Admin)'}</span>
              <button
                onClick={handleLogout}
                className="bg-zinc-700 hover:bg-gray-600 text-left px-4 py-2 rounded"
              >
                ログアウト
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)} className="hover:text-red-600 py-1">ログイン</Link>
              <Link
                to="/register"
                onClick={() => setMenuOpen(false)}
                className="bg-red-900 hover:bg-red-800 text-center px-4 py-2 rounded"
              >
                登録
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
