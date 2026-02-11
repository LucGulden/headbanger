import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import LoadingSpinner from './components/LoadingSpinner' // ← AJOUTER
import Layout from './components/Layout'
import ProtectedRoute from './guards/ProtectedRoute'
import PublicOnlyRoute from './guards/PublicOnlyRoute'
import Signup from './pages/Signup'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import Profile from './pages/Profile'
import Followers from './pages/Followers'
import Following from './pages/Following'
import Notifications from './pages/Notifications'
import Search from './pages/Search'
import Settings from './pages/Settings'
import HomeRoute from './guards/HomeRoute'
import VinylPage from './pages/Vinyl'
import AlbumPage from './pages/Album'
import ArtistPage from './pages/Artist'

function App() {
  const { loading } = useAuth()

  // ✅ Afficher un loader global pendant l'initialisation
  if (loading) {
    return <LoadingSpinner fullScreen size="lg" />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          {/* Route dynamique selon auth */}
          <Route path="/" element={<HomeRoute />} />

          {/* Routes publiques uniquement (bloquées si connecté) */}
          <Route element={<PublicOnlyRoute />}>
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
          </Route>

          {/* Routes protégées (bloquées si déconnecté) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Routes publiques (accessibles à tous) */}
          <Route path="/search" element={<Search />} />
          <Route path="/profile/:username/followers" element={<Followers />} />
          <Route path="/profile/:username/following" element={<Following />} />
          <Route path="/profile/:username" element={<Profile />} />
          <Route path="/vinyl/:id" element={<VinylPage />} />
          <Route path="/album/:id" element={<AlbumPage />} />
          <Route path="/artist/:id" element={<ArtistPage />} />
          
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App