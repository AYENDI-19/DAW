import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n/LanguageContext';
import { 
  Users, 
  Calendar, 
  Dumbbell, 
  Activity, 
  ChevronRight, 
  PlusCircle, 
  Save,
  LogOut
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

export default function TrainerDashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [entrenador, setEntrenador] = useState(null);
  const [activeTab, setActiveTab] = useState('classes');
  const [clientes, setClientes] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [mensajeGlobal, setMensajeGlobal] = useState(null);
  const [clases, setClases] = useState([]);
  const [selectedClassForModal, setSelectedClassForModal] = useState(null);

  // Formulario Rutina
  const [clienteId, setClienteId] = useState('');
  const [nombreRutina, setNombreRutina] = useState('');
  const [ejercicios, setEjercicios] = useState([
    { nombre_ejercicio: '', series: '', repeticiones: '', peso_sugerido: '' },
  ]);

  const [clientProgressData, setClientProgressData] = useState([]);

  useEffect(() => {
    if (!selectedClient) return;

    const fetchProgress = async () => {
      try {
        const res = await fetch(`/api/historial-ejercicios/cliente/${selectedClient.id}`);
        if (res.ok) {
          const data = await res.json();
          // Backend returns descending by date, so reverse it for the chart
          const formattedData = data.reverse().map(item => ({
            date: new Date(item.fecha).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            weight: item.peso,
            ejercicio: item.ejercicio_nombre
          }));
          setClientProgressData(formattedData);
        } else {
          setClientProgressData([]);
        }
      } catch (error) {
        console.error("Error fetching progress", error);
        setClientProgressData([]);
      }
    };
    fetchProgress();
  }, [selectedClient]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    const cargarDatos = async () => {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const emailLogueado = payload.sub;

        const resUsuarios = await fetch('/api/usuarios');
        if (resUsuarios.ok) {
          const listaUsuarios = await resUsuarios.json();
          const usuarioActual = listaUsuarios.find((u) => u.email === emailLogueado);

          if (!usuarioActual || usuarioActual.rol !== 'entrenador') {
            alert('⛔ ACCESO DENEGADO');
            navigate('/');
            return;
          }

          setEntrenador(usuarioActual);
          setClientes(listaUsuarios.filter((u) => u.rol === 'cliente'));
          
          const resClases = await fetch('/api/clases');
          if (resClases.ok) {
            const dataClases = await resClases.json();
            setClases(dataClases.filter(c => c.entrenador_id === usuarioActual.id));
          }
        }
      } catch (error) {
        console.error('Error cargando panel:', error);
        navigate('/');
      }
    };

    cargarDatos();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const mostrarMensaje = (tipo, texto) => {
    setMensajeGlobal({ tipo, texto });
    setTimeout(() => setMensajeGlobal(null), 5000);
  };

  const handleAgregarEjercicio = () => {
    setEjercicios([
      ...ejercicios,
      { nombre_ejercicio: '', series: '', repeticiones: '', peso_sugerido: '' },
    ]);
  };

  const handleActualizarEjercicio = (index, campo, valor) => {
    const nuevosEjercicios = [...ejercicios];
    nuevosEjercicios[index][campo] = valor;
    setEjercicios(nuevosEjercicios);
  };

  const handleEliminarEjercicio = (index) => {
    setEjercicios(ejercicios.filter((_, i) => i !== index));
  };

  const handleGuardarRutina = async (e) => {
    e.preventDefault();
    if (!clienteId) return mostrarMensaje('error', 'Selecciona a qué cliente le vas a asignar la rutina.');

    try {
      const payload = {
        nombre: nombreRutina,
        descripcion: 'Rutina asignada desde el Dashboard', // Simplificado para el ejemplo
        entrenador_id: entrenador.id,
        cliente_id: parseInt(clienteId),
        ejercicios: ejercicios.map(ej => ({
          nombre_ejercicio: ej.nombre_ejercicio,
          series: parseInt(ej.series) || 0,
          repeticiones: ej.repeticiones, // String
          descanso_segundos: 60, // Default
          peso_sugerido: parseFloat(ej.peso_sugerido) || 0 // ¡Nuevo campo!
        })),
      };

      const respuesta = await fetch('/api/rutinas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (respuesta.ok) {
        mostrarMensaje('exito', '¡Rutina asignada correctamente!');
        setClienteId('');
        setNombreRutina('');
        setEjercicios([{ nombre_ejercicio: '', series: '', repeticiones: '', peso_sugerido: '' }]);
      } else {
        mostrarMensaje('error', 'Error al guardar en FastAPI');
      }
    } catch (error) {
      mostrarMensaje('error', 'Error de conexión.');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'classes':
        return (
          <div className="animate-fade-in">
            <div className="relative h-48 rounded-[2.5rem] overflow-hidden mb-8 shadow-2xl border-2 border-zinc-800">
              <img src="/assets/gym_stats.png" alt="Stats" className="w-full h-full object-cover opacity-70 mix-blend-lighten" />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/50 via-zinc-950/40 to-transparent"></div>
              <div className="absolute bottom-6 left-8">
                <h2 className="text-4xl font-black italic uppercase tracking-tight text-slate-900 dark:text-white drop-shadow-md">
                  {t('trainer.controlPanel')} <span className="text-orange-500">{t('trainer.controlPanelHighlight')}</span>
                </h2>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">{t('trainer.todayClasses')}</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {clases.map(cls => (
                <div key={cls.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-lg hover:border-orange-500 transition-colors">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-orange-400">{cls.nombre}</h3>
                    <Calendar className="text-zinc-500" />
                  </div>
                  <p className="text-zinc-300 text-lg mb-2">{new Date(cls.fecha_inicio).toLocaleString()}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-500">{t('trainer.students')}</span>
                    <span className={`font-bold ${cls.reservas_count >= cls.aforo_maximo ? 'text-red-400' : 'text-green-400'}`}>
                      {cls.reservas_count} / {cls.aforo_maximo}
                    </span>
                  </div>
                  <div className="mt-4 w-full bg-white dark:bg-zinc-800 rounded-full h-2 mb-4">
                    <div 
                      className={`h-2 rounded-full ${cls.reservas_count >= cls.aforo_maximo ? 'bg-red-500' : 'bg-orange-500'}`} 
                      style={{ width: `${Math.min((cls.reservas_count / cls.aforo_maximo) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <button 
                    onClick={() => setSelectedClassForModal(cls)}
                    className="w-full mt-2 bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-2 rounded-lg transition text-sm flex items-center justify-center gap-2"
                  >
                    <Users size={16} /> {t('trainer.viewStudents')}
                  </button>
                </div>
              ))}
              {clases.length === 0 && (
                <div className="col-span-full py-10 text-center text-zinc-500">
                  {t('trainer.noClasses')}
                </div>
              )}
            </div>
          </div>
        );

      case 'clients':
        return (
          <div className="animate-fade-in grid gap-8 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">{t('trainer.myClients')}</h2>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-lg">
                <table className="w-full text-left">
                  <thead className="bg-white dark:bg-zinc-800 text-zinc-400">
                    <tr>
                      <th className="p-4 font-medium">{t('general.name')}</th>
                      <th className="p-4 font-medium">{t('general.email')}</th>
                      <th className="p-4 font-medium">{t('general.action')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {clientes.map(client => (
                      <tr key={client.id} className="hover:bg-white dark:bg-zinc-800/50 transition-colors">
                        <td className="p-4 text-slate-900 dark:text-white font-medium">{client.nombre}</td>
                        <td className="p-4 text-zinc-400">{client.email}</td>
                        <td className="p-4">
                          <button 
                            onClick={() => setSelectedClient(client)}
                            className="flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300 transition-colors"
                          >
                            {t('trainer.viewProgress')} <ChevronRight size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {clientes.length === 0 && (
                      <tr>
                        <td colSpan="3" className="p-4 text-center text-zinc-500">{t('trainer.noClients')}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Client Progress Chart */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-lg">
              {selectedClient ? (
                <>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t('trainer.progressOf')} {selectedClient.nombre}</h3>
                  <p className="text-zinc-400 mb-6 text-sm">{t('trainer.progressDesc')}</p>
                  <div className="h-64 w-full">
                    {clientProgressData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={clientProgressData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                          <XAxis dataKey="date" stroke="#a1a1aa" />
                          <YAxis stroke="#a1a1aa" />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }} 
                            labelStyle={{ color: '#f97316' }}
                            formatter={(value, name, props) => [`${value} kg`, props.payload.ejercicio || 'Peso']}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="weight" 
                            stroke="#f97316" 
                            strokeWidth={3}
                            dot={{ fill: '#f97316', r: 4 }}
                            activeDot={{ r: 6 }} 
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-zinc-500">
                        <Activity size={48} className="mb-4 opacity-30" />
                        <p>{t('trainer.noProgress')}</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500">
                  <Activity size={48} className="mb-4 opacity-50" />
                  <p>{t('trainer.selectClient')}</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'routines':
        return (
          <div className="animate-fade-in max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">{t('trainer.routineCreator')}</h2>
            <form className="bg-zinc-900 border border-zinc-800 p-8 rounded-xl shadow-lg" onSubmit={handleGuardarRutina}>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">{t('trainer.selectClientLabel')}</label>
                  <select 
                    className="w-full bg-white dark:bg-zinc-800 border border-zinc-700 text-slate-900 dark:text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                    value={clienteId}
                    onChange={(e) => setClienteId(e.target.value)}
                    required
                  >
                    <option value="" disabled>{t('trainer.chooseClient')}</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">{t('trainer.routineName')}</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Rutina de Fuerza"
                    className="w-full bg-white dark:bg-zinc-800 border border-zinc-700 text-slate-900 dark:text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                    value={nombreRutina}
                    onChange={(e) => setNombreRutina(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="mb-4 flex justify-between items-center border-b border-zinc-800 pb-2">
                <h3 className="text-xl font-bold text-orange-500">{t('trainer.exercises')}</h3>
                <button 
                  type="button" 
                  onClick={handleAgregarEjercicio}
                  className="text-sm font-bold bg-white dark:bg-zinc-800 hover:bg-zinc-700 px-3 py-1 rounded text-slate-900 dark:text-white transition flex items-center gap-2"
                >
                  <PlusCircle size={16} /> {t('trainer.addExercise')}
                </button>
              </div>

              <div className="space-y-4 mb-8">
                {ejercicios.map((ejercicio, index) => (
                  <div key={index} className="grid grid-cols-12 gap-4 items-end bg-zinc-950 p-4 rounded-lg border border-zinc-800">
                    <div className="col-span-12 md:col-span-4">
                      <label className="block text-xs font-medium text-zinc-500 mb-1">{t('trainer.exerciseName')}</label>
                      <input 
                        type="text" 
                        placeholder="Ej: Sentadilla"
                        className="w-full bg-white dark:bg-zinc-800 border border-zinc-700 text-slate-900 dark:text-white rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        value={ejercicio.nombre_ejercicio}
                        onChange={(e) => handleActualizarEjercicio(index, 'nombre_ejercicio', e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-span-4 md:col-span-2">
                      <label className="block text-xs font-medium text-zinc-500 mb-1">{t('trainer.sets')}</label>
                      <input 
                        type="number" 
                        placeholder="4"
                        className="w-full bg-white dark:bg-zinc-800 border border-zinc-700 text-slate-900 dark:text-white rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        value={ejercicio.series}
                        onChange={(e) => handleActualizarEjercicio(index, 'series', e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-span-4 md:col-span-2">
                      <label className="block text-xs font-medium text-zinc-500 mb-1">{t('trainer.reps')}</label>
                      <input 
                        type="text" 
                        placeholder="10-12"
                        className="w-full bg-white dark:bg-zinc-800 border border-zinc-700 text-slate-900 dark:text-white rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        value={ejercicio.repeticiones}
                        onChange={(e) => handleActualizarEjercicio(index, 'repeticiones', e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-span-4 md:col-span-3">
                      <label className="block text-xs font-medium text-zinc-500 mb-1">{t('trainer.suggestedWeight')}</label>
                      <input 
                        type="number" 
                        placeholder="80"
                        className="w-full bg-white dark:bg-zinc-800 border border-zinc-700 text-slate-900 dark:text-white rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        value={ejercicio.peso_sugerido}
                        onChange={(e) => handleActualizarEjercicio(index, 'peso_sugerido', e.target.value)}
                      />
                    </div>
                    <div className="col-span-12 md:col-span-1 flex justify-center pb-1">
                      {ejercicios.length > 1 && (
                        <button type="button" onClick={() => handleEliminarEjercicio(index)} className="text-red-500 hover:text-red-400">
                          <LogOut size={20} className="rotate-180" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-orange-500/20">
                <Save size={24} />
                {t('trainer.saveRoutine')}
              </button>
            </form>
          </div>
        );

      default:
        return null;
    }
  };

  if (!entrenador) return <div className="h-screen bg-black text-orange-500 flex items-center justify-center font-bold text-2xl">{t('general.loading')}</div>;

  return (
    <div className="flex h-screen bg-black font-sans selection:bg-orange-500 selection:text-white">
      {/* Sidebar Oscuro con toques naranjas */}
      <aside className="w-64 bg-zinc-950 border-r border-zinc-800/50 flex flex-col z-10 shadow-2xl">
        <div className="p-6 border-b border-zinc-800/50 text-center">
          <div className="flex items-center justify-center gap-2 text-orange-500 mb-4">
            <Dumbbell size={28} />
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">IRON<span className="text-orange-500">GYM</span></h1>
          </div>
          <div className="w-16 h-16 bg-zinc-900 rounded-full mx-auto mb-2 flex items-center justify-center text-xl shadow-inner border border-orange-500/30 text-slate-900 dark:text-white font-bold">
            {entrenador.nombre.charAt(0)}
          </div>
          <h2 className="font-bold text-slate-900 dark:text-white text-sm truncate">{entrenador.nombre}</h2>
          <p className="text-xs text-orange-500 font-medium tracking-widest uppercase mt-1">{t('trainer.portal')}</p>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <button 
            onClick={() => setActiveTab('classes')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === 'classes' 
                ? 'bg-orange-500/10 text-orange-500 font-semibold border border-orange-500/20' 
                : 'text-zinc-400 hover:text-slate-900 dark:text-white hover:bg-zinc-900'
            }`}
          >
            <Calendar size={20} />
            {t('trainer.myClasses')}
          </button>

          <button 
            onClick={() => setActiveTab('clients')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === 'clients' 
                ? 'bg-orange-500/10 text-orange-500 font-semibold border border-orange-500/20' 
                : 'text-zinc-400 hover:text-slate-900 dark:text-white hover:bg-zinc-900'
            }`}
          >
            <Users size={20} />
            {t('trainer.myClients')}
          </button>

          <button 
            onClick={() => setActiveTab('routines')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === 'routines' 
                ? 'bg-orange-500/10 text-orange-500 font-semibold border border-orange-500/20' 
                : 'text-zinc-400 hover:text-slate-900 dark:text-white hover:bg-zinc-900'
            }`}
          >
            <PlusCircle size={20} />
            {t('trainer.routineCreator')}
          </button>
        </nav>

        <div className="p-4 border-t border-zinc-800/50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 px-4 py-3 rounded-lg font-medium transition"
          >
            <LogOut size={18} />
            {t('general.logout')}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-10 bg-zinc-950/50 relative">
        {mensajeGlobal && (
          <div className={`absolute top-8 right-8 px-6 py-3 rounded-lg shadow-xl flex items-center gap-3 border z-50 ${
            mensajeGlobal.tipo === 'exito' ? 'bg-green-900/50 border-green-500/50 text-green-400' : 'bg-red-900/50 border-red-500/50 text-red-400'
          }`}>
            {mensajeGlobal.texto}
          </div>
        )}
        {renderContent()}
      </main>

      {/* Modal Alumnos Inscritos */}
      {selectedClassForModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-xl font-black text-white uppercase mb-1">
              {t('trainer.studentsIn')} <span className="text-orange-500">{selectedClassForModal.nombre}</span>
            </h3>
            <p className="text-zinc-400 text-sm mb-6">{t('admin.capacity')}: {selectedClassForModal.reservas_count} / {selectedClassForModal.aforo_maximo}</p>
            
            <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
              {selectedClassForModal.clientes_inscritos && selectedClassForModal.clientes_inscritos.length > 0 ? (
                selectedClassForModal.clientes_inscritos.map((cliente, idx) => (
                  <div key={idx} className="bg-zinc-800/50 border border-zinc-700 p-3 rounded-lg flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-orange-400 font-bold text-sm">
                      {cliente.nombre.charAt(0)}
                    </div>
                    <span className="text-white font-medium">{cliente.nombre}</span>
                  </div>
                ))
              ) : (
                <p className="text-zinc-500 text-center py-4">{t('trainer.noStudentsYet')}</p>
              )}
            </div>
            
            <button 
              onClick={() => setSelectedClassForModal(null)}
              className="mt-6 w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition"
            >
              {t('general.close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

