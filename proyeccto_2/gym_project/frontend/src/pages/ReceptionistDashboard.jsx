import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { 
  Users, Activity, AlertTriangle, Camera, Shield, ShieldOff, UserPlus, X, CheckCircle, Search, RefreshCw, Clock, LogOut
} from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

export default function ReceptionistDashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  // Filtros y listado de clientes
  const [clientes, setClientes] = useState([]);
  const [filtroNombre, setFiltroNombre] = useState('');
  
  // Alta rápida de cliente
  const [isAltaOpen, setIsAltaOpen] = useState(false);
  const [altaForm, setAltaForm] = useState({ email: '', password: '', nombre: '' });
  const [altaFoto, setAltaFoto] = useState(null);
  const [altaLoading, setAltaLoading] = useState(false);
  const [altaMsg, setAltaMsg] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Foto para cliente existente
  const [fotoClienteId, setFotoClienteId] = useState(null);
  const [fotoClienteImg, setFotoClienteImg] = useState(null);
  const [fotoCamActiva, setFotoCamActiva] = useState(false);
  const fotoVideoRef = useRef(null);
  const fotoCanvasRef = useRef(null);
  const fotoStreamRef = useRef(null);

  // Historial de accesos
  const [accessLogs, setAccessLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Cargar estadísticas
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/dashboard-stats');
      if (response.ok) {
        setStats(await response.json());
      }
    } catch (err) {
      console.error('Error cargando estadísticas', err);
    }
  }, []);

  // Cargar clientes reales
  const fetchClientes = useCallback(async () => {
    try {
      const res = await fetch('/api/usuarios');
      if (res.ok) {
        const data = await res.json();
        setClientes(data.filter(u => u.rol === 'cliente'));
      }
    } catch (e) { 
      console.error('Error cargando clientes', e); 
    }
  }, []);

  // Cargar registros de acceso QR
  const fetchAccessLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const res = await fetch('/api/acceso/logs?limit=10');
      if (res.ok) {
        setAccessLogs(await res.json());
      }
    } catch (e) {
      console.error('Error cargando historial de acceso', e);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  // Verificar sesión y rol
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.rol !== 'recepcionista' && payload.rol !== 'admin') {
        navigate('/');
        return;
      }
    } catch (e) {
      navigate('/');
      return;
    }

    const loadAll = async () => {
      await Promise.all([fetchStats(), fetchClientes(), fetchAccessLogs()]);
      setLoading(false);
    };
    loadAll();
  }, [navigate, fetchStats, fetchClientes, fetchAccessLogs]);

  // Escáner QR
  useEffect(() => {
    if (isScannerOpen) {
      const scanner = new Html5QrcodeScanner('reader', { fps: 10, qrbox: { width: 250, height: 250 } });
      scanner.render(
        async (decodedText) => {
          try {
            const data = JSON.parse(decodedText);
            const response = await fetch('/api/acceso/escanear-qr', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ usuario_id: data.usuario_id }),
            });
            const result = await response.json();
            
            setScanResult({ success: response.ok, message: result.mensaje || result.detail });
            scanner.clear();
            setIsScannerOpen(false);
            
            // Actualizar datos tras escaneo exitoso o fallido
            fetchStats();
            fetchAccessLogs();
          } catch (err) {
            setScanResult({ success: false, message: 'Código QR no reconocido o error de lectura' });
          }
        },
        (err) => {}
      );
      return () => scanner.clear();
    }
  }, [isScannerOpen, fetchStats, fetchAccessLogs]);

  // Cambiar estado de membresía (Activar / Suspender)
  const toggleMembresia = async (id, estadoActual) => {
    try {
      const res = await fetch(`/api/usuarios/${id}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membresia_activa: !estadoActual })
      });
      if (res.ok) {
        fetchClientes();
        fetchStats();
      } else {
        alert("Error al actualizar la membresía");
      }
    } catch (e) {
      alert("Error de conexión con el servidor");
    }
  };

  // --- Webcam para Alta Rápida ---
  const iniciarCamara = useCallback(async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 320, height: 240 } });
      streamRef.current = s;
      setCameraActive(true);
    } catch (e) { 
      alert('No se pudo acceder a la cámara.'); 
    }
  }, []);

  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraActive]);

  const detenerCamara = useCallback(() => {
    if (streamRef.current) { 
      streamRef.current.getTracks().forEach(t => t.stop()); 
      streamRef.current = null; 
    }
    setCameraActive(false);
  }, []);

  const capturarFoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    canvasRef.current.width = 320; 
    canvasRef.current.height = 240;
    ctx.drawImage(videoRef.current, 0, 0, 320, 240);
    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
    altaFotoOriginal(dataUrl);
  }, [detenerCamara]);

  const altaFotoOriginal = (dataUrl) => {
    setAltaFoto(dataUrl);
    detenerCamara();
  };

  const cerrarModalAlta = useCallback(() => {
    detenerCamara();
    setIsAltaOpen(false); 
    setAltaForm({ email: '', password: '', nombre: '' }); 
    setAltaFoto(null); 
    setAltaMsg(null);
  }, [detenerCamara]);

  const handleAltaCliente = async (e) => {
    e.preventDefault();
    setAltaLoading(true); 
    setAltaMsg(null);
    try {
      const body = { email: altaForm.email, password: altaForm.password };
      if (altaForm.nombre.trim()) body.nombre = altaForm.nombre.trim();
      if (altaFoto) body.foto_perfil = altaFoto;
      
      const res = await fetch('/api/admin/clientes', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(body) 
      });
      const data = await res.json();
      if (res.ok) {
        setAltaMsg({ ok: true, text: `✅ Cliente "${data.nombre}" registrado con éxito (ID #${data.id}).` });
        setAltaForm({ email: '', password: '', nombre: '' }); 
        setAltaFoto(null);
        fetchClientes();
        fetchStats();
      } else {
        setAltaMsg({ ok: false, text: data.detail || 'Error al crear cliente' });
      }
    } catch (err) { 
      setAltaMsg({ ok: false, text: 'Error de conexión' }); 
    }
    setAltaLoading(false);
  };

  // --- Webcam para Fotografía de Cliente Existente ---
  const iniciarCamaraFotoCliente = useCallback(async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 320, height: 240 } });
      fotoStreamRef.current = s;
      setFotoCamActiva(true);
    } catch (e) { 
      alert('No se pudo acceder a la cámara.'); 
    }
  }, []);

  useEffect(() => {
    if (fotoCamActiva && fotoVideoRef.current && fotoStreamRef.current) {
      fotoVideoRef.current.srcObject = fotoStreamRef.current;
    }
  }, [fotoCamActiva]);

  const detenerCamaraFoto = useCallback(() => {
    if (fotoStreamRef.current) { 
      fotoStreamRef.current.getTracks().forEach(t => t.stop()); 
      fotoStreamRef.current = null; 
    }
    setFotoCamActiva(false);
  }, []);

  const capturarFotoCliente = useCallback(() => {
    if (!fotoVideoRef.current || !fotoCanvasRef.current) return;
    const ctx = fotoCanvasRef.current.getContext('2d');
    fotoCanvasRef.current.width = 320; 
    fotoCanvasRef.current.height = 240;
    ctx.drawImage(fotoVideoRef.current, 0, 0, 320, 240);
    setFotoClienteImg(fotoCanvasRef.current.toDataURL('image/jpeg', 0.8));
    detenerCamaraFoto();
  }, [detenerCamaraFoto]);

  const guardarFotoCliente = async () => {
    if (!fotoClienteId || !fotoClienteImg) return;
    try {
      const res = await fetch(`/api/usuarios/${fotoClienteId}/foto`, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ foto_perfil: fotoClienteImg }) 
      });
      if (res.ok) {
        fetchClientes();
        cerrarModalFoto();
      } else { 
        alert('Error al guardar la foto'); 
      }
    } catch (e) { 
      alert('Error de conexión'); 
    }
  };

  const cerrarModalFoto = useCallback(() => {
    detenerCamaraFoto();
    setFotoClienteId(null); 
    setFotoClienteImg(null);
  }, [detenerCamaraFoto]);

  // Filtrado de clientes
  const clientesFiltrados = clientes.filter(c => 
    c.nombre.toLowerCase().includes(filtroNombre.toLowerCase()) || 
    c.email.toLowerCase().includes(filtroNombre.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-zinc-950 min-h-screen text-slate-900 dark:text-white font-sans overflow-x-hidden selection:bg-orange-500">
      {/* Cabecera */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-zinc-800 pb-6 gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase flex items-center gap-3">
            <Activity className="text-orange-500 animate-pulse" size={36} />
            {t('reception.title')}<span className="text-orange-500">{t('reception.titleHighlight')}</span>
          </h1>
          <p className="text-zinc-500 uppercase tracking-widest text-xs mt-1 font-bold">{t('reception.subtitle')}</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => setIsAltaOpen(true)} 
            className="bg-green-600 hover:bg-green-500 px-5 py-3 rounded-lg font-bold transition-all shadow-lg shadow-green-500/20 inline-flex items-center gap-2 transform hover:-translate-y-1"
          >
            <UserPlus size={20} /> {t('reception.registerClient')}
          </button>
          
          <button 
            onClick={() => setIsScannerOpen(true)} 
            className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 px-5 py-3 rounded-lg font-bold transition-all shadow-lg shadow-orange-500/20 inline-flex items-center gap-2 transform hover:-translate-y-1"
          >
            <Camera size={20} /> {t('reception.scanQR')}
          </button>

          <button 
            onClick={() => { localStorage.removeItem('token'); navigate('/'); }} 
            className="bg-zinc-900 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-zinc-800 hover:border-red-500/30 px-5 py-3 rounded-lg font-bold transition-all inline-flex items-center gap-2"
          >
            <LogOut size={18} /> {t('reception.exit')}
          </button>
        </div>
      </header>

      {/* Alerta de Último Escaneo */}
      {scanResult && (
        <div className={`mb-8 p-5 rounded-2xl border animate-fade-in flex justify-between items-center ${scanResult.success ? 'bg-green-950/30 border-green-500/50 text-green-400' : 'bg-red-950/30 border-red-500/50 text-red-400'}`}>
          <div className="flex items-center gap-4 font-bold text-lg">
            {scanResult.success ? <CheckCircle className="text-green-500" size={24} /> : <AlertTriangle className="text-red-500" size={24} />}
            <span>{scanResult.message}</span>
          </div>
          <button onClick={() => setScanResult(null)} className="bg-slate-100 dark:bg-zinc-900/50 hover:bg-white dark:bg-zinc-800 p-2 rounded-lg text-zinc-400 hover:text-slate-900 dark:text-white transition">✕</button>
        </div>
      )}

      {/* Contenedor de KPIs Rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800 relative overflow-hidden">
          <Users className="absolute top-6 right-6 text-orange-500/5" size={70} />
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">{t('reception.activeMembers')}</p>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white">{stats?.clientes?.activos || 0}</h2>
          <p className="text-zinc-600 text-xs mt-2">{t('reception.totalRegistered')} {stats?.clientes?.total || 0} {t('reception.registered')}</p>
        </div>

        <div className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800 relative overflow-hidden">
          <Activity className="absolute top-6 right-6 text-green-500/5" size={70} />
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">{t('reception.entriesToday')}</p>
          <h2 className="text-4xl font-black text-green-400">{stats?.actividad_hoy?.accesos_totales || 0}</h2>
          <p className="text-zinc-600 text-xs mt-2">{t('reception.dailyFlow')}</p>
        </div>

        <div className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800 relative overflow-hidden">
          <AlertTriangle className="absolute top-6 right-6 text-red-500/5" size={70} />
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">{t('reception.deniedToday')}</p>
          <h2 className="text-4xl font-black text-red-400">{stats?.actividad_hoy?.accesos_denegados || 0}</h2>
          <p className="text-zinc-600 text-xs mt-2">{t('reception.incidents')}</p>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna Izquierda: Listado y Buscador de Clientes */}
        <div className="lg:col-span-2 bg-zinc-900/20 border border-zinc-800 rounded-3xl p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h3 className="text-xl font-black uppercase">{t('reception.clientManagement')}</h3>
              <p className="text-zinc-500 text-xs mt-1">{t('reception.clientManagementDesc')}</p>
            </div>
            
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-3.5 text-zinc-500" size={16} />
              <input 
                type="text" 
                placeholder={t('reception.searchClient')} 
                value={filtroNombre} 
                onChange={e => setFiltroNombre(e.target.value)} 
                className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-slate-900 dark:text-white placeholder-zinc-500 focus:border-orange-500 outline-none text-sm transition"
              />
            </div>
          </div>

          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-zinc-950 text-zinc-500 text-xs uppercase tracking-wider font-bold sticky top-0 z-10">
                <tr>
                  <th className="p-4">{t('admin.client')}</th>
                  <th className="p-4 text-center">{t('reception.passStatus')}</th>
                  <th className="p-4 text-center">{t('reception.profilePhoto')}</th>
                  <th className="p-4 text-right">{t('general.action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {clientesFiltrados.map(cliente => (
                  <tr key={cliente.id} className="hover:bg-zinc-900/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {cliente.foto_perfil ? (
                          <img src={cliente.foto_perfil} alt="" className="w-10 h-10 rounded-full object-cover border border-orange-500/30" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm font-bold text-zinc-400">
                            {cliente.nombre?.charAt(0)?.toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-sm">{cliente.nombre}</p>
                          <p className="text-xs text-zinc-500 font-mono">ID: #{cliente.id.toString().padStart(4, '0')} • {cliente.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-black text-xs border ${
                        cliente.membresia_activa ? 'bg-green-500/10 text-green-400 border-green-500/25' : 'bg-red-500/10 text-red-400 border-red-500/25'
                      }`}>
                        {cliente.membresia_activa ? <><Shield size={12}/> {t('general.active')}</> : <><ShieldOff size={12}/> {t('general.suspended')}</>}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => { setFotoClienteId(cliente.id); setFotoClienteImg(cliente.foto_perfil || null); }} 
                        className="text-xs font-bold px-3 py-2 rounded-lg bg-zinc-900 hover:bg-white dark:bg-zinc-800 border border-zinc-800 hover:border-orange-500/50 text-zinc-300 hover:text-orange-400 inline-flex items-center gap-1.5 transition"
                      >
                        <Camera size={14} /> {cliente.foto_perfil ? t('admin.change') : t('admin.add')}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => toggleMembresia(cliente.id, cliente.membresia_activa)}
                        className={`text-xs font-bold px-4 py-2 rounded-lg transition border ${
                          cliente.membresia_activa 
                            ? 'bg-slate-100 dark:bg-zinc-900/50 hover:bg-red-500/10 text-red-400 border-red-500/20 hover:border-red-500/40' 
                            : 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500 shadow-md shadow-orange-500/15'
                        }`}
                      >
                        {cliente.membresia_activa ? t('admin.suspend') : t('admin.activate')}
                      </button>
                    </td>
                  </tr>
                ))}
                {clientesFiltrados.length === 0 && (
                  <tr>
                    <td colSpan="4" className="p-12 text-center text-zinc-650 italic font-medium">
                      {t('reception.noClientsFound')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Columna Derecha: Registro de Accesos Recientes en Tiempo Real */}
        <div className="bg-zinc-900/20 border border-zinc-800 rounded-3xl p-6 shadow-xl flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-black uppercase flex items-center gap-2">
                <Clock className="text-orange-500 animate-spin" style={{ animationDuration: '8s' }} size={22} />
                {t('reception.liveAccess')}
              </h3>
              <p className="text-zinc-500 text-xs mt-1">{t('reception.liveDesc')}</p>
            </div>
            <button 
              onClick={fetchAccessLogs} 
              disabled={logsLoading}
              className="p-2 hover:bg-white dark:bg-zinc-800/80 rounded-lg text-zinc-400 hover:text-slate-900 dark:text-white transition disabled:opacity-50"
              title="Refrescar accesos"
            >
              <RefreshCw size={18} className={logsLoading ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="space-y-4 flex-1 max-h-[500px] overflow-y-auto pr-1">
            {accessLogs.map(log => (
              <div 
                key={log.id} 
                className={`p-4 rounded-2xl border flex items-center gap-4 transition-all ${
                  log.exito 
                    ? 'bg-green-950/10 border-green-500/10 hover:border-green-500/20' 
                    : 'bg-red-950/10 border-red-500/10 hover:border-red-500/20'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  log.exito 
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  {log.usuario_nombre.charAt(0).toUpperCase()}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">{log.usuario_nombre}</h4>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {log.exito ? t('reception.accessSuccess') : `${t('reception.accessDenied')} ${log.error_msg}`}
                  </p>
                </div>
                
                <div className="text-right">
                  <span className="text-[11px] font-semibold text-zinc-400 bg-zinc-850 px-2.5 py-1 rounded-full">
                    {new Date(log.fecha_acceso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            
            {accessLogs.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-zinc-600 py-16">
                <Clock size={40} className="opacity-30 mb-2" />
                <span className="text-sm font-medium italic">{t('reception.noAccessLogs')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== MODAL SCANNER QR ===== */}
      {isScannerOpen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-zinc-900 rounded-3xl border border-zinc-800 w-full max-w-md relative shadow-2xl p-6 overflow-hidden">
            <button onClick={() => setIsScannerOpen(false)} className="absolute top-4 right-4 bg-zinc-850 hover:bg-white dark:bg-zinc-800 p-2 rounded-xl text-zinc-400 hover:text-slate-900 dark:text-white transition">✕</button>
            <h2 className="text-2xl font-black uppercase text-center mb-6">{t('reception.validateQR')} <span className="text-orange-500">QR</span></h2>
            <div id="reader" className="overflow-hidden rounded-2xl border-2 border-zinc-800"></div>
          </div>
        </div>
      )}

      {/* ===== MODAL REGISTRO DE CLIENTE ===== */}
      {isAltaOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-3xl border border-zinc-855 w-full max-w-lg relative shadow-2xl overflow-hidden animate-scale-in">
            <div className="bg-gradient-to-r from-green-600 to-green-500 p-5 flex justify-between items-center text-slate-900 dark:text-white">
              <h2 className="text-xl font-black uppercase flex items-center gap-2"><UserPlus size={22} /> {t('reception.registerNewMember')}</h2>
              <button onClick={cerrarModalAlta} className="bg-white/10 hover:bg-white/20 p-1.5 rounded-lg text-slate-900 dark:text-white transition"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleAltaCliente} className="p-6 space-y-5">
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 block">{t('general.email')} *</label>
                <input 
                  type="email" 
                  required 
                  value={altaForm.email} 
                  onChange={e => setAltaForm({...altaForm, email: e.target.value})} 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-green-500 outline-none text-sm transition-all" 
                  placeholder="ejemplo@correo.com" 
                />
              </div>
              
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 block">{t('reception.accessPassword')} *</label>
                <input 
                  type="text" 
                  required 
                  value={altaForm.password} 
                  onChange={e => setAltaForm({...altaForm, password: e.target.value})} 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-green-500 outline-none text-sm transition-all" 
                  placeholder={t('reception.initialPassword')} 
                />
              </div>
              
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 block">{t('reception.fullNameLabel')} <span className="text-zinc-650">({t('general.optional')})</span></label>
                <input 
                  type="text" 
                  value={altaForm.nombre} 
                  onChange={e => setAltaForm({...altaForm, nombre: e.target.value})} 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-green-500 outline-none text-sm transition-all" 
                  placeholder={t('admin.fullName')} 
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 block">{t('reception.memberPhoto')} <span className="text-zinc-650">({t('general.optional')})</span></label>
                <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-4 flex flex-col items-center gap-3">
                  {altaFoto ? (
                    <>
                      <img src={altaFoto} alt="Foto capturada" className="w-32 h-32 rounded-full object-cover border-4 border-green-500/40 shadow-lg shadow-green-500/10" />
                      <button type="button" onClick={() => setAltaFoto(null)} className="text-xs text-red-400 hover:text-red-300 font-bold bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20 transition">{t('reception.deletePhoto')}</button>
                    </>
                  ) : cameraActive ? (
                    <>
                      <video ref={videoRef} autoPlay playsInline muted className="w-64 h-48 rounded-xl border border-zinc-700 bg-black object-cover" />
                      <button type="button" onClick={capturarFoto} className="bg-green-600 hover:bg-green-500 text-white font-bold px-6 py-2 rounded-xl inline-flex items-center gap-2 text-sm shadow-md transition-all"><Camera size={16} /> {t('reception.captureImage')}</button>
                    </>
                  ) : (
                    <button type="button" onClick={iniciarCamara} className="bg-zinc-850 hover:bg-white dark:bg-zinc-800 border border-zinc-750 text-zinc-300 font-bold px-6 py-3 rounded-xl inline-flex items-center gap-2 text-sm transition-all shadow-inner"><Camera size={18} /> {t('reception.openWebcam')}</button>
                  )}
                </div>
              </div>

              {altaMsg && (
                <div className={`p-4 rounded-xl text-sm font-semibold flex items-center gap-3 border ${altaMsg.ok ? 'bg-green-950/40 border-green-500/25 text-green-400' : 'bg-red-950/40 border-red-500/25 text-red-400'}`}>
                  {altaMsg.ok ? <CheckCircle className="text-green-500" size={18} /> : <AlertTriangle className="text-red-500" size={18} />} 
                  <span>{altaMsg.text}</span>
                </div>
              )}

              <button 
                type="submit" 
                disabled={altaLoading} 
                className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-3.5 rounded-xl uppercase tracking-wider transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-green-600/20"
              >
                {altaLoading ? t('reception.registering') : <><UserPlus size={18} /> {t('reception.registerMember')}</>}
              </button>
            </form>
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>
      )}

      {/* ===== MODAL FOTOGRAFÍA DE CLIENTE EXISTENTE ===== */}
      {fotoClienteId && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-3xl border border-zinc-800 w-full max-w-md relative shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-orange-600 to-orange-500 p-5 flex justify-between items-center">
              <h2 className="text-lg font-black uppercase flex items-center gap-2 text-slate-900 dark:text-white"><Camera size={20} /> {t('reception.idPhoto')} (# {fotoClienteId})</h2>
              <button onClick={cerrarModalFoto} className="bg-white/10 hover:bg-white/20 p-1 rounded-lg text-slate-900 dark:text-white transition"><X size={20} /></button>
            </div>
            
            <div className="p-6 flex flex-col items-center gap-4">
              {fotoClienteImg && !fotoCamActiva ? (
                <>
                  <img src={fotoClienteImg} alt="Foto socio" className="w-40 h-40 rounded-full object-cover border-4 border-orange-500/40 shadow-lg shadow-orange-500/10" />
                  <div className="flex gap-3">
                    <button onClick={() => setFotoClienteImg(null)} className="text-xs text-red-400 hover:text-red-300 font-bold px-4 py-2 bg-red-500/10 rounded-lg border border-red-500/20 transition">{t('general.delete')}</button>
                    <button onClick={iniciarCamaraFotoCliente} className="text-xs text-orange-400 font-bold px-4 py-2 bg-orange-500/10 rounded-lg border border-orange-500/20 inline-flex items-center gap-1.5 transition"><Camera size={14} /> {t('reception.newCapture')}</button>
                  </div>
                </>
              ) : fotoCamActiva ? (
                <>
                  <video ref={fotoVideoRef} autoPlay playsInline muted className="w-64 h-48 rounded-xl border border-zinc-700 bg-black object-cover" />
                  <button onClick={capturarFotoCliente} className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-6 py-2 rounded-xl inline-flex items-center gap-2 text-sm shadow-md transition"><Camera size={16} /> {t('reception.captureImage')}</button>
                </>
              ) : (
                <button onClick={iniciarCamaraFotoCliente} className="bg-zinc-850 hover:bg-white dark:bg-zinc-850 border border-zinc-750 text-zinc-300 font-bold px-6 py-3 rounded-xl inline-flex items-center gap-2 text-sm transition shadow-inner"><Camera size={18} /> {t('reception.openWebcam')}</button>
              )}
              
              {fotoClienteImg && !fotoCamActiva && (
                <button 
                  onClick={guardarFotoCliente} 
                  className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-3.5 rounded-xl uppercase tracking-wider transition shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 mt-2"
                >
                  <CheckCircle size={18} /> {t('reception.saveImage')}
                </button>
              )}
            </div>
            <canvas ref={fotoCanvasRef} className="hidden" />
          </div>
        </div>
      )}
    </div>
  );
}
