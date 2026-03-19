import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { clearAuth, getUsername, isLoggedIn, isAdmin } from '../auth'
import { getEditRequestCount, getMe, getNewUserCount, getReportCount } from '../api'
import MessageOverlay from './MessageOverlay'

export default function Navbar() {
  const navigate = useNavigate()
  const loggedIn = isLoggedIn()
  const admin = isAdmin()
  const [menuOpen, setMenuOpen] = useState(false)
  const [adminMenuOpen, setAdminMenuOpen] = useState(false)
  const [adminMobileOpen, setAdminMobileOpen] = useState(false)
  const [showLogoutOverlay, setShowLogoutOverlay] = useState(false)
  const [editRequestCount, setEditRequestCount] = useState(0)
  const [reportCount, setReportCount] = useState(0)
  const [newUserCount, setNewUserCount] = useState(0)
  const [enlightenment, setEnlightenment] = useState<number | null>(null)
  const [floatingPoints, setFloatingPoints] = useState<{ amount: number; key: number } | null>(null)
  const adminMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (adminMenuRef.current && !adminMenuRef.current.contains(e.target as Node)) {
        setAdminMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!loggedIn) return
    getMe().then((res) => setEnlightenment(res.data.enlightenment)).catch(() => {})
    const onUpdate = (e: Event) => {
      const amount = (e as CustomEvent<{ amount: number }>).detail?.amount
      if (amount) setFloatingPoints({ amount, key: Date.now() })
      getMe().then((res) => setEnlightenment(res.data.enlightenment)).catch(() => {})
    }
    window.addEventListener('enlightenmentUpdate', onUpdate)
    return () => window.removeEventListener('enlightenmentUpdate', onUpdate)
  }, [loggedIn])

  useEffect(() => {
    if (!admin) return
    const fetchCounts = () => {
      getEditRequestCount().then((res) => setEditRequestCount(res.data.count)).catch(() => {})
      getReportCount().then((res) => setReportCount(res.data.count)).catch(() => {})
      const lastViewed = parseInt(localStorage.getItem('adminUsersLastViewed') || '0', 10)
      getNewUserCount(lastViewed).then((res) => setNewUserCount(res.data.count)).catch(() => {})
    }
    fetchCounts()
    const interval = setInterval(fetchCounts, 60000)
    const onViewed = () => setNewUserCount(0)
    window.addEventListener('adminUsersViewed', onViewed)
    return () => {
      clearInterval(interval)
      window.removeEventListener('adminUsersViewed', onViewed)
    }
  }, [admin])

  const totalBadge = editRequestCount + reportCount + newUserCount

  const handleLogout = () => {
    setMenuOpen(false)
    setShowLogoutOverlay(true)
  }

  return (
    <>
      {showLogoutOverlay && (
        <MessageOverlay
          message="ログアウトしました"
          onClose={() => {
            setShowLogoutOverlay(false)
            clearAuth()
            navigate('/')
          }}
        />
      )}
      <nav className="bg-zinc-900 text-white shadow">
      <div className="px-4 sm:px-8 py-4 flex items-center justify-between">
        <Link to="/" className="text-lg sm:text-2xl font-bold text-gray-100 hover:text-gray-300 leading-tight">
          <span className="hidden sm:inline">FROMDEX</span>
          <span className="sm:hidden">FROMDEX</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/catalog" className="hover:text-gray-300 text-base">目録</Link>
          <Link to="/items" className="hover:text-gray-300 text-base">アイテム図録</Link>
          <Link to="/bosses" className="hover:text-gray-300 text-base">ボス図録</Link>
          <Link to="/npcs" className="hover:text-gray-300 text-base">NPC図録</Link>
          <Link to="/games" className="hover:text-gray-300 text-base">ゲーム一覧</Link>
          <Link to="/relation-graph" className="hover:text-gray-300 text-base">相関図</Link>
          <Link to="/boards" className="hover:text-gray-300 text-base">掲示板</Link>
          {loggedIn ? (
            <>
              <Link to="/mypage" className="hover:text-gray-300 text-base">マイページ</Link>
              {admin && (
                <div className="relative" ref={adminMenuRef}>
                  <button
                    onClick={() => setAdminMenuOpen((o) => !o)}
                    className="hover:text-gray-300 text-base flex items-center gap-1"
                  >
                    管理者機能
                    {totalBadge > 0 && (
                      <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-xs font-bold px-1">
                        {totalBadge > 99 ? '99+' : totalBadge}
                      </span>
                    )}
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {adminMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-44 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg z-50 py-1">
                      <Link to="/edit-requests" onClick={() => setAdminMenuOpen(false)} className="flex items-center justify-between px-4 py-2 text-sm hover:bg-zinc-700 hover:text-white">
                        <span>編集承認</span>
                        {editRequestCount > 0 && <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-xs font-bold px-1">{editRequestCount}</span>}
                      </Link>
                      <Link to="/reports" onClick={() => setAdminMenuOpen(false)} className="flex items-center justify-between px-4 py-2 text-sm hover:bg-zinc-700 hover:text-white">
                        <span>通報管理</span>
                        {reportCount > 0 && <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-xs font-bold px-1">{reportCount}</span>}
                      </Link>
                      <Link to="/tags" onClick={() => setAdminMenuOpen(false)} className="block px-4 py-2 text-sm hover:bg-zinc-700 hover:text-white">タグ管理</Link>
                      <Link to="/admin/users" onClick={() => setAdminMenuOpen(false)} className="flex items-center justify-between px-4 py-2 text-sm hover:bg-zinc-700 hover:text-white">
                        <span>ユーザー一覧</span>
                        {newUserCount > 0 && <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-xs font-bold px-1">{newUserCount}</span>}
                      </Link>
                    </div>
                  )}
                </div>
              )}
              {enlightenment !== null && (
                <span className="relative flex items-center gap-1 text-amber-400 text-sm font-medium">
                  {floatingPoints && (
                    <span
                      key={floatingPoints.key}
                      className="enlightenment-float absolute -top-1 left-1/2 -translate-x-1/2 text-amber-300 text-xs font-bold pointer-events-none whitespace-nowrap"
                      onAnimationEnd={() => setFloatingPoints(null)}
                    >
                      +{floatingPoints.amount}
                    </span>
                  )}
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                  </svg>
                  {enlightenment}
                </span>
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
              <span className="text-gray-500 text-sm">名もなき褪せ人</span>
              <Link to="/login" className="text-gray-400 hover:text-gray-200 text-sm">ログイン</Link>
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
          <Link to="/catalog" onClick={() => setMenuOpen(false)} className="hover:text-gray-300 py-1">目録</Link>
          <Link to="/items" onClick={() => setMenuOpen(false)} className="hover:text-gray-300 py-1">アイテム図録</Link>
          <Link to="/bosses" onClick={() => setMenuOpen(false)} className="hover:text-gray-300 py-1">ボス図録</Link>
          <Link to="/npcs" onClick={() => setMenuOpen(false)} className="hover:text-gray-300 py-1">NPC図録</Link>
          <Link to="/games" onClick={() => setMenuOpen(false)} className="hover:text-gray-300 py-1">ゲーム一覧</Link>
          <Link to="/relation-graph" onClick={() => setMenuOpen(false)} className="hover:text-gray-300 py-1">相関図</Link>
          <Link to="/boards" onClick={() => setMenuOpen(false)} className="hover:text-gray-300 py-1">掲示板</Link>
          {loggedIn ? (
            <>
              <Link to="/mypage" onClick={() => setMenuOpen(false)} className="hover:text-gray-300 py-1">マイページ</Link>
              {admin && (
                <div>
                  <button
                    onClick={() => setAdminMobileOpen((o) => !o)}
                    className="hover:text-gray-300 py-1 flex items-center gap-2 w-full text-left"
                  >
                    管理者機能
                    {totalBadge > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-xs font-bold px-1">
                        {totalBadge > 99 ? '99+' : totalBadge}
                      </span>
                    )}
                    <svg className={`w-3 h-3 transition-transform ${adminMobileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {adminMobileOpen && (
                    <div className="pl-4 flex flex-col gap-2 mt-1">
                      <Link to="/edit-requests" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 hover:text-gray-300 py-1 text-sm text-gray-300">
                        編集承認
                        {editRequestCount > 0 && <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-xs font-bold px-1">{editRequestCount}</span>}
                      </Link>
                      <Link to="/reports" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 hover:text-gray-300 py-1 text-sm text-gray-300">
                        通報管理
                        {reportCount > 0 && <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-xs font-bold px-1">{reportCount}</span>}
                      </Link>
                      <Link to="/tags" onClick={() => setMenuOpen(false)} className="hover:text-gray-300 py-1 text-sm text-gray-300">タグ管理</Link>
                      <Link to="/admin/users" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 hover:text-gray-300 py-1 text-sm text-gray-300">
                        ユーザー一覧
                        {newUserCount > 0 && <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-xs font-bold px-1">{newUserCount}</span>}
                      </Link>
                    </div>
                  )}
                </div>
              )}
              {enlightenment !== null && (
                <span className="flex items-center gap-1 text-amber-400 text-sm font-medium py-1">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                  </svg>
                  啓蒙 {enlightenment}
                </span>
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
              <span className="text-gray-500 text-sm py-1">名もなき褪せ人</span>
              <Link to="/login" onClick={() => setMenuOpen(false)} className="text-gray-400 hover:text-gray-200 text-sm py-1">ログイン</Link>
            </>
          )}
        </div>
      )}
      </nav>
    </>
  )
}
