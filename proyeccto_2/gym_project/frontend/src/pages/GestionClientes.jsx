import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'

// Datos de ejemplo para la gráfica (Simulando evolución)
const datosProgreso = [
  { fecha: '01/05', peso: 5, reps: 8 },
  { fecha: '02/05', peso: 7.5, reps: 10 },
  { fecha: '04/05', peso: 7.5, reps: 12 },
  { fecha: '06/05', peso: 10, reps: 8 },
]

export default function ClientDashboard() {
  const navigate = useNavigate()
  const [usuario, setUsuario] = useState(null)
  const [vistaActiva, setVistaActiva] = useState('resumen')
  const [clases, setClases] = useState([])
  const [rutinas, setRutinas] = useState([])
  const [mensajeGlobal, setMensajeGlobal] = useState(null)

  useEffect(() => {
    // Si no hay token, lo mandamos al login (la ruta raíz por ahora)
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/')
      return
    }

    const cargarDatosCliente = async () => {
      try {
        // Extraemos el email del Token JWT decodificando la carga útil (payload)
        const payload = JSON.parse(atob(token.split('.')[1]))
        const emailLogueado = payload.sub

        // Hacemos el fetch con la ruta correcta (/api/usuarios)
        const resUsuarios = await fetch('/api/usuarios')
        if (resUsuarios.ok) {
          const listaUsuarios = await resUsuarios.json()
          const clienteActual = listaUsuarios.find((u) => u.email === emailLogueado)

          if (!clienteActual || clienteActual.rol !== 'cliente') {
            navigate('/')
            return
          }
          setUsuario(clienteActual)

          // Cargar clases
          const resClases = await fetch('/api/clases')
          if (resClases.ok) setClases(await resClases.json())

          // Cargar rutinas
          const resRutinas = await fetch(
            `/api/rutinas/cliente/${clienteActual.id}`,
          )
          if (resRutinas.ok) setRutinas(await resRutinas.json())
        }
      } catch (error) {
        console.error(error)
        navigate('/')
      }
    }
    cargarDatosCliente()
  }, [navigate])

  const handleReservar = async (claseId) => {
    try {
      const respuesta = await fetch('/api/reservas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clase_id: claseId,
        }),
      })

      if (respuesta.ok) {
        setMensajeGlobal({ tipo: 'exito', texto: '¡Plaza reservada con éxito!' })
      } else {
        const error = await respuesta.json()
        setMensajeGlobal({ tipo: 'error', texto: error.detail || 'Error en la reserva' })
      }
      setTimeout(() => setMensajeGlobal(null), 3000)
    } catch (error) {
      setMensajeGlobal({ tipo: 'error', texto: 'Error de conexión' })
    }
  }

  const handleRegistrarProgreso = (ejercicioNombre) => {
    setMensajeGlobal({ tipo: 'exito', texto: `¡Progreso guardado en ${ejercicioNombre}!` })
    setTimeout(() => setMensajeGlobal(null), 3000)
  }

  if (!usuario)
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center text-slate-900 dark:text-white">
        Cargando Panel del Cliente...
      </div>
    )

  return (
    <div className="flex h-screen bg-gray-900 text-slate-900 dark:text-white font-sans">
      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-gray-800 border-r border-slate-200 dark:border-gray-700 flex flex-col shadow-2xl">
        <div className="p-6 border-b border-slate-200 dark:border-gray-700 text-center">
          <div className="w-16 h-16 bg-orange-500 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold shadow-lg">
            {usuario.nombre.charAt(0)}
          </div>
          <h2 className="font-bold truncate">{usuario.nombre}</h2>
          <p className="text-xs text-orange-400">ID Socio: #00{usuario.id}</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setVistaActiva('resumen')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${vistaActiva === 'resumen' ? 'bg-orange-500 shadow-lg shadow-orange-500/20' : 'hover:bg-gray-700 text-slate-500 dark:text-gray-400'}`}
          >
            ðŸ  Inicio
          </button>
          <button
            onClick={() => setVistaActiva('rutinas')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${vistaActiva === 'rutinas' ? 'bg-orange-500 shadow-lg shadow-orange-500/20' : 'hover:bg-gray-700 text-slate-500 dark:text-gray-400'}`}
          >
            ðŸ‹ï¸ Mis Rutinas
          </button>
          <button
            onClick={() => setVistaActiva('progreso')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${vistaActiva === 'progreso' ? 'bg-orange-500 shadow-lg shadow-orange-500/20' : 'hover:bg-gray-700 text-slate-500 dark:text-gray-400'}`}
          >
            ðŸ“Š Mi Progreso
          </button>
          <button
            onClick={() => setVistaActiva('clases')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${vistaActiva === 'clases' ? 'bg-orange-500 shadow-lg shadow-orange-500/20' : 'hover:bg-gray-700 text-slate-500 dark:text-gray-400'}`}
          >
            ðŸ“… Clases
          </button>
        </nav>
        <button
          onClick={() => {
            localStorage.removeItem('token')
            navigate('/')
          }}
          className="m-4 p-3 text-red-400 hover:bg-red-500/10 rounded-xl transition text-sm font-medium"
        >
          Cerrar Sesión
        </button>
      </aside>

      {/* --- CONTENIDO --- */}
      <main className="flex-1 p-8 overflow-y-auto bg-gray-900 relative">
        {mensajeGlobal && (
          <div
            className={`absolute top-8 right-8 px-6 py-3 rounded-lg shadow-2xl z-50 animate-bounce ${mensajeGlobal.tipo === 'exito' ? 'bg-green-500' : 'bg-red-500'} text-slate-900 dark:text-white`}
          >
            {mensajeGlobal.texto}
          </div>
        )}

        {/* SECCIÃ“N INICIO CON CARNET */}
        {vistaActiva === 'resumen' && (
          <div className="max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeIn">
            <div className="space-y-6">
              <h1 className="text-4xl font-black italic tracking-tighter uppercase">
                IRON<span className="text-orange-500">PASS</span>
              </h1>
              <div
                className={`p-8 rounded-3xl border-2 transition-all ${usuario.membresia_activa ? 'bg-green-500/10 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.2)]' : 'bg-red-500/10 border-red-500'}`}
              >
                <p className="text-sm font-bold text-slate-500 dark:text-gray-400 mb-2 uppercase">
                  Estado de Membresía
                </p>
                <span
                  className={`text-4xl font-black ${usuario.membresia_activa ? 'text-green-400' : 'text-red-400'}`}
                >
                  {usuario.membresia_activa ? 'ACTIVA' : 'INACTIVA'}
                </span>
                <p className="mt-4 text-slate-600 dark:text-gray-300 italic">
                  Vence el:{' '}
                  <span className="text-slate-900 dark:text-white font-bold">
                    {usuario.fecha_fin_membresia
                      ? new Date(usuario.fecha_fin_membresia).toLocaleDateString()
                      : '--/--/----'}
                  </span>
                </p>
              </div>
            </div>

            {/* CARNET DIGITAL Y CÃ“DIGO QR */}
            <div
              className={`bg-white p-6 rounded-[2.5rem] flex flex-col items-center justify-center shadow-2xl relative overflow-hidden ${!usuario.membresia_activa ? 'opacity-50 grayscale' : ''}`}
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-orange-500"></div>
              <p className="text-[10px] text-slate-500 dark:text-gray-400 font-black uppercase mb-4 tracking-widest">
                Acceso al Gimnasio
              </p>
              <div className="p-4 bg-white rounded-2xl border-4 border-black relative">
                <QRCodeSVG
                  value={JSON.stringify({ usuario_id: usuario.id, timestamp: Date.now() })}
                  size={160}
                />
                {!usuario.membresia_activa && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                    <span className="text-red-600 font-bold border-2 border-red-600 px-2 py-1 rotate-[-15deg]">
                      DENEGADO
                    </span>
                  </div>
                )}
              </div>
              <p className="mt-4 font-black text-black text-xl tracking-tight uppercase">
                {usuario.nombre}
              </p>
              <p className="text-[10px] text-gray-500 font-medium">
                Muestra este código en el lector de entrada
              </p>
            </div>
          </div>
        )}

        {/* SECCIÃ“N PROGRESO */}
        {vistaActiva === 'progreso' && (
          <div className="space-y-8 animate-fadeIn">
            <header>
              <h1 className="text-3xl font-black italic uppercase tracking-tighter">
                Análisis de <span className="text-orange-500">Rendimiento</span>
              </h1>
              <p className="text-slate-500 dark:text-gray-400">Tu evolución física detallada.</p>
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-gray-800 p-6 rounded-3xl border border-slate-200 dark:border-gray-700 shadow-xl">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  ðŸ“ˆ Evolución de Carga (kg)
                </h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={datosProgreso}>
                      <defs>
                        <linearGradient id="colorPeso" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                      <XAxis
                        dataKey="fecha"
                        stroke="#9ca3af"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          border: 'none',
                          borderRadius: '12px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="peso"
                        stroke="#f97316"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorPeso)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="space-y-6">
                <div className="bg-orange-500 p-6 rounded-3xl shadow-lg">
                  <p className="text-orange-100 text-sm font-bold uppercase">Record Personal</p>
                  <h4 className="text-4xl font-black mt-1">
                    10 <span className="text-lg uppercase">kg</span>
                  </h4>
                </div>
                <div className="bg-gray-800 p-6 rounded-3xl border border-slate-200 dark:border-gray-700">
                  <p className="text-slate-500 dark:text-gray-400 text-sm font-bold uppercase">Volumen Semanal</p>
                  <h4 className="text-4xl font-black text-slate-900 dark:text-white mt-1">
                    1,240 <span className="text-lg uppercase">kg</span>
                  </h4>
                  <p className="text-green-400 text-xs mt-2">â†‘ 12% progreso</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECCIÃ“N CLASES */}
        {vistaActiva === 'clases' && (
          <div className="space-y-8 animate-fadeIn">
            <header>
              <h1 className="text-3xl font-black italic uppercase tracking-tighter">
                Próximas <span className="text-orange-500">Clases</span>
              </h1>
              <p className="text-slate-500 dark:text-gray-400">Reserva tu lugar ahora.</p>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {clases.map((clase) => (
                <div
                  key={clase.id}
                  className="bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-[2rem] p-6 shadow-xl hover:border-orange-500 transition-all group relative overflow-hidden"
                >
                  <h3 className="text-2xl font-black italic text-slate-900 dark:text-white uppercase mb-4">
                    {clase.nombre}
                  </h3>
                  <div className="space-y-3 mb-6 text-sm text-slate-500 dark:text-gray-400">
                    <p>ðŸ•’ {new Date(clase.fecha_inicio).toLocaleString()}</p>
                    <p>
                      ðŸ‘¥ Aforo:{' '}
                      <span className="text-slate-900 dark:text-white font-bold">{clase.aforo_maximo} plazas</span>
                    </p>
                  </div>
                  <button
                    onClick={() => handleReservar(clase.id)}
                    disabled={!usuario.membresia_activa}
                    className={`w-full py-4 rounded-2xl font-black uppercase transition-all ${usuario.membresia_activa ? 'bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/20' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
                  >
                    {usuario.membresia_activa ? 'Reservar Ahora' : 'Requiere Membresía'}
                  </button>
                </div>
              ))}
              {clases.length === 0 && (
                <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 dark:border-gray-700 rounded-[3rem] text-gray-500">
                  No hay clases programadas.
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECCIÃ“N RUTINAS */}
        {vistaActiva === 'rutinas' && (
          <div className="space-y-8 animate-fadeIn">
            <h1 className="text-3xl font-black italic tracking-tighter uppercase">
              Plan de <span className="text-orange-500">Entrenamiento</span>
            </h1>
            {rutinas.map((rutina) => (
              <div
                key={rutina.id}
                className="bg-gray-800 rounded-3xl border border-slate-200 dark:border-gray-700 overflow-hidden shadow-xl"
              >
                <div className="p-6 bg-gray-700/30">
                  <h3 className="text-xl font-bold text-orange-400">{rutina.nombre}</h3>
                </div>
                <div className="p-6 space-y-4">
                  {rutina.ejercicios &&
                    rutina.ejercicios.map((ej, idx) => (
                      <div
                        key={idx}
                        className="bg-gray-900 p-5 rounded-2xl flex flex-col md:row justify-between items-center gap-4"
                      >
                        <div className="flex-1">
                          <p className="font-bold text-lg">{ej.nombre_ejercicio}</p>
                          <p className="text-xs text-slate-500 dark:text-gray-400">
                            {ej.series} series x {ej.repeticiones} reps
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            placeholder="Kg"
                            className="w-16 bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg p-2 text-center text-sm focus:border-orange-500 outline-none"
                          />
                          <input
                            type="number"
                            placeholder="Reps"
                            className="w-16 bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg p-2 text-center text-sm focus:border-orange-500 outline-none"
                          />
                          <button
                            onClick={() => handleRegistrarProgreso(ej.nombre_ejercicio)}
                            className="bg-orange-500 hover:bg-orange-600 p-2 rounded-lg transition"
                          >
                            âœ…
                          </button>
                        </div>
                      </div>
                    ))}
                  {(!rutina.ejercicios || rutina.ejercicios.length === 0) && (
                    <p className="text-gray-500">No hay ejercicios asignados a esta rutina.</p>
                  )}
                </div>
              </div>
            ))}
            {rutinas.length === 0 && (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 dark:border-gray-700 rounded-[3rem] text-gray-500">
                Aún no tienes rutinas asignadas.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}


