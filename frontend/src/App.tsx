import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Footer from './components/Footer'
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
import NpcsPage from './pages/NpcsPage'
import NpcDetailPage from './pages/NpcDetailPage'
import NpcFormPage from './pages/NpcFormPage'
import CatalogPage from './pages/CatalogPage'

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col bg-black">
        <Navbar />
        <main className="flex-1">
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
            <Route path="/npcs" element={<NpcsPage />} />
            <Route path="/npcs/new" element={<NpcFormPage />} />
            <Route path="/npcs/:id" element={<NpcDetailPage />} />
            <Route path="/npcs/:id/edit" element={<NpcFormPage />} />
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/tags" element={<TagsAdminPage />} />
            <Route path="/news" element={<AllNewsListPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}
