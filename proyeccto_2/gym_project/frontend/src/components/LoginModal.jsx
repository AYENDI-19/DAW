import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '../i18n/LanguageContext'

const LoginModal = ({ isOpen, onClose }) => {
  const [credenciales, setCredenciales] = useState({ email: '', password: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { t } = useTranslation()

  if (!isOpen) return null

  const handleChange = (e) => {
    setCredenciales({ ...credenciales, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credenciales),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Error al iniciar sesión')
      }

      const data = await response.json()

      // 1. Guardamos el Token seguro en el navegador
      localStorage.setItem('token', data.access_token)

      // 2. Limpiamos y cerramos
      setCredenciales({ email: '', password: '' })
      onClose()

      // 3. Redirección inteligente según el rol
      if (data.usuario.rol === 'admin') {
        navigate('/admin')
      } else if (data.usuario.rol === 'recepcionista') {
        navigate('/recepcionista')
      } else if (data.usuario.rol === 'entrenador') {
        navigate('/entrenador')
      } else {
        navigate('/cliente')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl w-full max-w-sm border border-slate-200 dark:border-gray-700 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:text-white text-xl"
        >
          ✕
        </button>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-black italic text-slate-900 dark:text-white uppercase tracking-tighter">
            IRON<span className="text-orange-500">GYM</span>
          </h2>
          <p className="text-slate-500 dark:text-gray-400 mt-2 text-sm">{t('login.title')}</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg mb-6 text-sm text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="text-slate-500 dark:text-gray-400 text-sm font-semibold mb-2 block uppercase tracking-wider">
              {t('login.emailLabel')}
            </label>
            <input
              type="email"
              name="email"
              value={credenciales.email}
              onChange={handleChange}
              required
              placeholder="tu@email.com"
              className="w-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-gray-700 rounded-lg p-3 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition"
            />
          </div>

          <div>
            <label className="text-slate-500 dark:text-gray-400 text-sm font-semibold mb-2 block uppercase tracking-wider">
              {t('login.passwordLabel')}
            </label>
            <input
              type="password"
              name="password"
              value={credenciales.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
              className="w-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-gray-700 rounded-lg p-3 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-lg font-black uppercase tracking-wider transition shadow-lg shadow-orange-500/20 mt-4 disabled:opacity-50"
          >
            {loading ? t('login.loading') : t('login.submit')}
          </button>
        </form>
      </div>
    </div>
  )
}

export default LoginModal
