import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
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

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-black">
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/games" element={<GamesPage />} />
          <Route path="/games/:id" element={<GameDetailPage />} />
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
          <Route path="/tags" element={<TagsAdminPage />} />
          <Route path="/news" element={<AllNewsListPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
