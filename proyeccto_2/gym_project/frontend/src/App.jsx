import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Sun, Moon } from 'lucide-react'

// Importamos todas nuestras páginas
import LandingPage from './pages/LandingPage'
import ClientDashboard from './pages/ClientDashboard'
import AdminDashboard from './pages/AdminDashboard'
import GestionClientes from './pages/GestionClientes'
import TrainerDashboard from './pages/TrainerDashboard'
import ReceptionistDashboard from './pages/ReceptionistDashboard'
import InstallPWA from './components/InstallPWA'
import LanguageSwitcher from './components/LanguageSwitcher'


// Opcional: Componente para proteger las rutas (evitar que alguien entre sin login)
const RutaProtegida = ({ children }) => {
  const token = localStorage.getItem('token')
  if (!token) {
    return <Navigate to="/" /> // Si no hay token, lo mandamos al inicio
  }
  return children
}

function App() {
  const [isLight, setIsLight] = useState(false)

  useEffect(() => {
    // Default to dark mode unless 'light' is explicitly set
    if (localStorage.getItem('theme') === 'light') {
      document.documentElement.classList.remove('dark')
      setIsLight(true)
    } else {
      document.documentElement.classList.add('dark')
      setIsLight(false)
    }
  }, [])

  const toggleTheme = () => {
    if (isLight) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
      setIsLight(false)
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
      setIsLight(true)
    }
  }

  return (
    <>
      <InstallPWA />
      <LanguageSwitcher />
      <button 
        onClick={toggleTheme}
        className="fixed bottom-6 right-6 z-[9999] p-4 rounded-full bg-white dark:bg-zinc-800 text-orange-500 shadow-2xl hover:bg-zinc-700 hover:text-slate-900 dark:text-white transition-all hover:scale-110 border-2 border-orange-500/30 flex items-center justify-center group"
        title="Cambiar Modo de Visualización"
      >
        {isLight ? <Moon size={24} className="group-hover:rotate-12 transition-transform" /> : <Sun size={24} className="group-hover:rotate-90 transition-transform" />}
      </button>
      <Router>
        <Routes>
          {/* Ruta pública (Cualquiera puede verla) */}
        <Route path="/" element={<LandingPage />} />

        {/* Rutas Privadas del Cliente */}
        <Route
          path="/cliente"
          element={
            <RutaProtegida>
              <ClientDashboard />
            </RutaProtegida>
          }
        />

        {/* Rutas Privadas del Administrador */}
        <Route
          path="/admin"
          element={
            <RutaProtegida>
              <AdminDashboard />
            </RutaProtegida>
          }
        />

        {/* Rutas Privadas del Entrenador */}
        <Route
          path="/entrenador"
          element={
            <RutaProtegida>
              <TrainerDashboard />
            </RutaProtegida>
          }
        />

        {/* Rutas Privadas del Recepcionista */}
        <Route
          path="/recepcionista"
          element={
            <RutaProtegida>
              <ReceptionistDashboard />
            </RutaProtegida>
          }
        />

        {/* Ruta de Gestión de Clientes (También para el Admin) */}
        <Route
          path="/admin/clientes"
          element={
            <RutaProtegida>
              <GestionClientes />
            </RutaProtegida>
          }
        />

        {/* Ruta por defecto por si alguien escribe una URL que no existe */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
    </>
  )
}

export default App
