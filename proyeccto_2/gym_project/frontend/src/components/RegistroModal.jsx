import { useState } from 'react'

const RegistroModal = ({ isOpen, onClose, onUserCreated }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    password: '',
    rol: 'cliente', // Por defecto
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  if (!isOpen) return null

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Error al registrar el usuario')
      }

      // Limpiar formulario y cerrar
      setFormData({ nombre: '', email: '', telefono: '', password: '', rol: 'cliente' })
      onUserCreated() // Actualiza la tabla del componente padre
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-xl w-full max-w-md border border-slate-200 dark:border-gray-700 shadow-2xl">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Registrar Nuevo Usuario</h2>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-slate-500 dark:text-gray-400 text-sm mb-1 block">Nombre Completo</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
              className="w-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border border-gray-600 rounded p-2 focus:border-orange-500 outline-none"
            />
          </div>

          <div>
            <label className="text-slate-500 dark:text-gray-400 text-sm mb-1 block">Correo Electrónico</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border border-gray-600 rounded p-2 focus:border-orange-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-slate-500 dark:text-gray-400 text-sm mb-1 block">Teléfono</label>
              <input
                type="text"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border border-gray-600 rounded p-2 focus:border-orange-500 outline-none"
              />
            </div>
            <div>
              <label className="text-slate-500 dark:text-gray-400 text-sm mb-1 block">Asignar Rol</label>
              <select
                name="rol"
                value={formData.rol}
                onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border border-gray-600 rounded p-2 focus:border-orange-500 outline-none cursor-pointer"
              >
                <option value="cliente">Cliente</option>
                <option value="entrenador">Entrenador</option>
                <option value="recepcionista">Recepcionista</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>

          {/* Dinamismo visual: Aviso si se selecciona entrenador */}
          {formData.rol === 'entrenador' && (
            <div className="text-xs text-blue-400 bg-blue-500/10 p-2 rounded">
              ℹ️ Se creará automáticamente un perfil profesional en la base de datos de monitores.
            </div>
          )}

          <div>
            <label className="text-slate-500 dark:text-gray-400 text-sm mb-1 block">Contraseña Temporal</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
              className="w-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border border-gray-600 rounded p-2 focus:border-orange-500 outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:text-white transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded font-semibold transition disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RegistroModal
