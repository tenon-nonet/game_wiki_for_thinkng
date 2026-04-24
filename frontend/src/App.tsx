import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Footer from './components/Footer'
import Navbar from './components/Navbar'
import BgmPlayer from './components/BgmPlayer'
import { useEffect, useState } from 'react'
import { onAuthChanged, isLoggedIn } from './auth'
import { getMe } from './api'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import GamesPage from './pages/GamesPage'
import GameDetailPage from './pages/GameDetailPage'
import ItemsPage from './pages/ItemsPage'
import ItemDetailPage from './pages/ItemDetailPage'
import ItemFormPage from './pages/ItemFormPage'
import TagsAdminPage from './pages/TagsAdminPage'
import BulkImportPage from './pages/BulkImportPage'
import NewsListPage from './pages/NewsListPage'
import AllNewsListPage from './pages/AllNewsListPage'
import BossesPage from './pages/BossesPage'
import BossDetailPage from './pages/BossDetailPage'
import BossFormPage from './pages/BossFormPage'
import NpcsPage from './pages/NpcsPage'
import NpcDetailPage from './pages/NpcDetailPage'
import NpcFormPage from './pages/NpcFormPage'
import CatalogPage from './pages/CatalogPage'
import BoardsPage from './pages/BoardsPage'
import BoardThreadsPage from './pages/BoardThreadsPage'
import BoardThreadDetailPage from './pages/BoardThreadDetailPage'
import MyPage from './pages/MyPage'
import MyEditHistoriesPage from './pages/MyEditHistoriesPage'
import MyCommentsPage from './pages/MyCommentsPage'
import EditRequestsPage from './pages/EditRequestsPage'
import ReportsPage from './pages/ReportsPage'
import AdminUsersPage from './pages/AdminUsersPage'
import RelationGraphPage from './pages/RelationGraphPage'
import RelationGraphSelectPage from './pages/RelationGraphSelectPage'
import TimelinePage from './pages/TimelinePage'

function bgOpacity(enlightenment: number): number {
  if (enlightenment >= 20) return 0.85
  if (enlightenment >= 10) return 0.45
  if (enlightenment >= 1) return 0.18
  return 0
}

function AppLayout({ authVersion, enlightenment }: { authVersion: number; enlightenment: number }) {
  const opacity = bgOpacity(enlightenment)
  return (
    <div key={authVersion} className="relative flex min-h-screen flex-col bg-black">
      {opacity > 0 && (
        <div
          className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-1000"
          style={{
            backgroundImage: 'url(/hero-enlightened.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity,
          }}
        />
      )}
      <div className="relative z-10 flex flex-1 flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/games" element={<GamesPage />} />
            <Route path="/games/:id" element={<GameDetailPage />} />
            <Route path="/relation-graph" element={<RelationGraphSelectPage />} />
            <Route path="/games/:id/relation-graph" element={<RelationGraphPage />} />
            <Route path="/timeline/:id" element={<TimelinePage />} />
            <Route path="/games/:id/news" element={<NewsListPage />} />
            <Route path="/items" element={<ItemsPage />} />
            <Route path="/items/new" element={<ItemFormPage />} />
            <Route path="/items/bulk-import" element={<BulkImportPage />} />
            <Route path="/items/:id" element={<ItemDetailPage />} />
            <Route path="/items/:id/edit" element={<ItemFormPage />} />
            <Route path="/bosses" element={<BossesPage />} />
            <Route path="/bosses/new" element={<BossFormPage />} />
            <Route path="/bosses/:id" element={<BossDetailPage />} />
            <Route path="/bosses/:id/edit" element={<BossFormPage />} />
            <Route path="/npcs" element={<NpcsPage />} />
            <Route path="/npcs/new" element={<NpcFormPage />} />
            <Route path="/npcs/:id" element={<NpcDetailPage />} />
            <Route path="/npcs/:id/edit" element={<NpcFormPage />} />
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/boards" element={<BoardsPage />} />
            <Route path="/boards/general" element={<BoardThreadsPage />} />
            <Route path="/boards/general/:threadId" element={<BoardThreadDetailPage />} />
            <Route path="/boards/:gameId" element={<BoardThreadsPage />} />
            <Route path="/boards/:gameId/:threadId" element={<BoardThreadDetailPage />} />
            <Route path="/mypage" element={<MyPage />} />
            <Route path="/mypage/edit-histories" element={<MyEditHistoriesPage />} />
            <Route path="/mypage/comments" element={<MyCommentsPage />} />
            <Route path="/edit-requests" element={<EditRequestsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/tags" element={<TagsAdminPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/news" element={<AllNewsListPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
      <BgmPlayer />
    </div>
  )
}

export default function App() {
  const [authVersion, setAuthVersion] = useState(0)
  const [enlightenment, setEnlightenment] = useState(0)

  useEffect(() => {
    const fetchEnlightenment = () => {
      if (isLoggedIn()) getMe().then((r) => setEnlightenment(r.data.enlightenment)).catch(() => {})
      else setEnlightenment(0)
    }

    fetchEnlightenment()
    const unsubscribe = onAuthChanged(() => {
      setAuthVersion((v) => v + 1)
      fetchEnlightenment()
    })
    const onStorage = () => setAuthVersion((v) => v + 1)
    const onEnlightenment = () => fetchEnlightenment()
    window.addEventListener('storage', onStorage)
    window.addEventListener('enlightenmentUpdate', onEnlightenment)
    return () => {
      unsubscribe()
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('enlightenmentUpdate', onEnlightenment)
    }
  }, [])

  return (
    <BrowserRouter>
      <AppLayout authVersion={authVersion} enlightenment={enlightenment} />
    </BrowserRouter>
  )
}
