import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import AuthInitializer from './components/AuthInitializer'
import ChatPage from './pages/ChatPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import { useThemeStore } from './stores/themeStore'

function ThemeRouteSynchronizer() {
  const location = useLocation()
  const syncThemeForRoute = useThemeStore((state) => state.syncThemeForRoute)

  useEffect(() => {
    syncThemeForRoute(location.pathname)
  }, [location.pathname, syncThemeForRoute])

  return null
}

function App() {
  return (
    <>
      <ThemeRouteSynchronizer />
      <AuthInitializer />

      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/chat/:chatId" element={<ChatPage />} />
        <Route path="/c/:chatId" element={<ChatPage />} />

        <Route
          path="/"
          element={<Navigate to="/chat" replace />}
        />
      </Routes>
    </>
  )
}

export default App