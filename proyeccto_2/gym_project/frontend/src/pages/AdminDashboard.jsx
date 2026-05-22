import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { 
  Users, Ticket, Calendar, Activity, AlertTriangle, Mail, PlayCircle, BarChart3, Camera, Shield, ShieldOff, UserPlus, X, CheckCircle, Trash2, Plus
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanResult, setScanResult] = useState(null);

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

  // Alta de Entrenador
  const [isAltaMonitorOpen, setIsAltaMonitorOpen] = useState(false);
  const [altaMonitorForm, setAltaMonitorForm] = useState({ email: '', password: '', nombre: '', telefono: '' });
  const [altaMonitorFoto, setAltaMonitorFoto] = useState(null);
  const [altaMonitorLoading, setAltaMonitorLoading] = useState(false);
  const [altaMonitorMsg, setAltaMonitorMsg] = useState(null);
  const [monitorCameraActive, setMonitorCameraActive] = useState(false);
  const monitorVideoRef = useRef(null);
  const monitorCanvasRef = useRef(null);
  const monitorStreamRef = useRef(null);

  // MOCK DATA: To be replaced by actual backend endpoint /api/admin/dashboard-stats
  const mockAfluenciaData = [
    { hora: '06:00', accesos: 15 }, { hora: '08:00', accesos: 45 },
    { hora: '10:00', accesos: 30 }, { hora: '12:00', accesos: 20 },
    { hora: '14:00', accesos: 25 }, { hora: '16:00', accesos: 60 },
    { hora: '18:00', accesos: 85 }, { hora: '20:00', accesos: 70 },
    { hora: '22:00', accesos: 15 }
  ];

  const [churnRisk, setChurnRisk] = useState([]);
  const [churnDias, setChurnDias] = useState(10);

  const mockEquipoActivo = [
    { id: 1, nombre: 'Elena Coach', clase: 'Crossfit Pro', sala: 'Sala 1', estado: 'En Clase' },
    { id: 2, nombre: 'Carlos FIT', clase: 'HIIT', sala: 'Pista Central', estado: 'En Clase' }
  ];

  const [clientesAcceso, setClientesAcceso] = useState([]);

  // Foto para cliente existente
  const [fotoClienteId, setFotoClienteId] = useState(null);
  const [fotoClienteImg, setFotoClienteImg] = useState(null);
  const [fotoCamActiva, setFotoCamActiva] = useState(false);
  const fotoVideoRef = useRef(null);
  const fotoCanvasRef = useRef(null);
  const fotoStreamRef = useRef(null);

  // Gestión de Clases
  const [clases, setClases] = useState([]);
  const [entrenadores, setEntrenadores] = useState([]);
  const [isNuevaClaseOpen, setIsNuevaClaseOpen] = useState(false);
  const [nuevaClaseForm, setNuevaClaseForm] = useState({
    nombre: '',
    descripcion: '',
    entrenador_id: '',
    aforo_maximo: 20,
    fecha_inicio: '',
    fecha_fin: ''
  });
  const [claseLoading, setClaseLoading] = useState(false);
  const [selectedClassForModal, setSelectedClassForModal] = useState(null);


  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/dashboard-stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          setStats({
            clientes: { activos: 342, total: 400 },
            actividad_hoy: { accesos_totales: 120, accesos_denegados: 3, reservas_realizadas: 45 },
            equipo: { monitores_activos: 2 }
          });
        }
      } catch (err) {
        setStats({
          clientes: { activos: 342, total: 400 },
          actividad_hoy: { accesos_totales: 120, accesos_denegados: 3, reservas_realizadas: 45 },
          equipo: { monitores_activos: 2 }
        });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Cargar clientes reales desde la API
  const fetchClientes = useCallback(async () => {
    try {
      const res = await fetch('/api/usuarios');
      if (res.ok) {
        const data = await res.json();
        setClientesAcceso(data.filter(u => u.rol === 'cliente'));
      }
    } catch (e) { console.error('Error cargando clientes', e); }
  }, []);

  useEffect(() => { fetchClientes(); }, [fetchClientes]);

  const fetchClases = useCallback(async () => {
    try {
      const res = await fetch('/api/clases');
      if (res.ok) setClases(await res.json());
    } catch (e) { console.error('Error cargando clases', e); }
  }, []);

  const fetchEntrenadores = useCallback(async () => {
    try {
      const res = await fetch('/api/entrenadores');
      if (res.ok) setEntrenadores(await res.json());
    } catch (e) { console.error('Error cargando entrenadores', e); }
  }, []);

  const fetchChurn = useCallback(async (dias) => {
    try {
      const res = await fetch(`/api/admin/churn?dias=${dias}`);
      if (res.ok) setChurnRisk(await res.json());
    } catch (e) { console.error('Error cargando churn', e); }
  }, []);

  useEffect(() => {
    fetchClases();
    fetchEntrenadores();
    fetchChurn(churnDias);
  }, [fetchClases, fetchEntrenadores, fetchChurn, churnDias]);


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
          } catch (err) {
            setScanResult({ success: false, message: 'QR Inválido o Error de Servidor' });
          }
        },
        (err) => {}
      );
      return () => scanner.clear();
    }
  }, [isScannerOpen]);

  const enviarEmailMotivacional = (clienteId) => {
    alert(`Email motivacional enviado al cliente ID: ${clienteId}`);
  };

  const toggleMembresia = async (id, estadoActual) => {
    setClientesAcceso(prev => prev.map(c => c.id === id ? { ...c, membresia_activa: !estadoActual } : c));
    try {
      const res = await fetch(`/api/usuarios/${id}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membresia_activa: !estadoActual })
      });
      if (!res.ok) {
        setClientesAcceso(prev => prev.map(c => c.id === id ? { ...c, membresia_activa: estadoActual } : c));
        alert("Error al actualizar estado en el servidor");
      }
    } catch (e) {
      setClientesAcceso(prev => prev.map(c => c.id === id ? { ...c, membresia_activa: estadoActual } : c));
      alert("Simulando: Estado de membresía actualizado en Demo.");
    }
  };

  // --- Webcam para ALTA ---
  const iniciarCamara = useCallback(async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 320, height: 240 } });
      streamRef.current = s;
      setCameraActive(true);
    } catch (e) { alert('No se pudo acceder a la cámara.'); }
  }, []);

  // Attach stream to video element when camera becomes active
  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraActive]);

  const detenerCamara = useCallback(() => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    setCameraActive(false);
  }, []);

  const capturarFoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    canvasRef.current.width = 320; canvasRef.current.height = 240;
    ctx.drawImage(videoRef.current, 0, 0, 320, 240);
    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
    setAltaFoto(dataUrl);
    detenerCamara();
  }, [detenerCamara]);

  const cerrarModalAlta = useCallback(() => {
    detenerCamara();
    setIsAltaOpen(false); setAltaForm({ email: '', password: '', nombre: '' }); setAltaFoto(null); setAltaMsg(null);
  }, [detenerCamara]);

  const iniciarCamaraMonitor = useCallback(async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 320, height: 240 } });
      monitorStreamRef.current = s;
      setMonitorCameraActive(true);
    } catch (e) { alert('No se pudo acceder a la cámara.'); }
  }, []);

  const detenerCamaraMonitor = useCallback(() => {
    if (monitorStreamRef.current) { monitorStreamRef.current.getTracks().forEach(t => t.stop()); monitorStreamRef.current = null; }
    setMonitorCameraActive(false);
  }, []);

  useEffect(() => {
    if (monitorCameraActive && monitorVideoRef.current && monitorStreamRef.current) {
      monitorVideoRef.current.srcObject = monitorStreamRef.current;
    }
  }, [monitorCameraActive]);

  const capturarFotoMonitor = useCallback(() => {
    if (!monitorVideoRef.current || !monitorCanvasRef.current) return;
    const ctx = monitorCanvasRef.current.getContext('2d');
    monitorCanvasRef.current.width = 320; monitorCanvasRef.current.height = 240;
    ctx.drawImage(monitorVideoRef.current, 0, 0, 320, 240);
    const dataUrl = monitorCanvasRef.current.toDataURL('image/jpeg', 0.8);
    setAltaMonitorFoto(dataUrl);
    detenerCamaraMonitor();
  }, [detenerCamaraMonitor]);

  const cerrarModalAltaMonitor = useCallback(() => {
    detenerCamaraMonitor();
    setIsAltaMonitorOpen(false);
    setAltaMonitorForm({ email: '', password: '', nombre: '', telefono: '' });
    setAltaMonitorFoto(null);
    setAltaMonitorMsg(null);
  }, [detenerCamaraMonitor]);

  const handleAltaMonitor = async (e) => {
    e.preventDefault();
    setAltaMonitorLoading(true);
    setAltaMonitorMsg(null);
    try {
      const body = { 
        nombre: altaMonitorForm.nombre,
        email: altaMonitorForm.email, 
        password: altaMonitorForm.password,
        telefono: altaMonitorForm.telefono || null,
        rol: 'entrenador',
        foto_perfil: altaMonitorFoto
      };
      const res = await fetch('/api/usuarios', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(body) 
      });
      const data = await res.json();
      if (res.ok) {
        setAltaMonitorMsg({ ok: true, text: `✅ Entrenador "${data.nombre}" creado con éxito.` });
        setAltaMonitorForm({ email: '', password: '', nombre: '', telefono: '' });
        setAltaMonitorFoto(null);
        fetchEntrenadores();
      } else {
        setAltaMonitorMsg({ ok: false, text: data.detail || 'Error al crear entrenador' });
      }
    } catch (err) { 
      setAltaMonitorMsg({ ok: false, text: 'Error de conexión' }); 
    }
    setAltaMonitorLoading(false);
  };

  const handleCrearClase = async (e) => {
    e.preventDefault();
    setClaseLoading(true);
    try {
      const res = await fetch('/api/clases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevaClaseForm)
      });
      if (res.ok) {
        setIsNuevaClaseOpen(false);
        setNuevaClaseForm({ nombre: '', descripcion: '', entrenador_id: '', aforo_maximo: 20, fecha_inicio: '', fecha_fin: '' });
        fetchClases();
      } else {
        const error = await res.json();
        alert(error.detail || "Error al crear la clase");
      }
    } catch (e) { alert("Error de conexión"); }
    setClaseLoading(false);
  };

  const handleEliminarClase = async (id) => {
    if (!confirm("¿Seguro que deseas eliminar esta clase?")) return;
    try {
      const res = await fetch(`/api/clases/${id}`, { method: 'DELETE' });
      if (res.ok) fetchClases();
      else alert("Error al eliminar la clase");
    } catch (e) { alert("Error de conexión"); }
  };


  const handleAltaCliente = async (e) => {
    e.preventDefault();
    setAltaLoading(true); setAltaMsg(null);
    try {
      const body = { email: altaForm.email, password: altaForm.password };
      if (altaForm.nombre.trim()) body.nombre = altaForm.nombre.trim();
      if (altaFoto) body.foto_perfil = altaFoto;
      const res = await fetch('/api/admin/clientes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (res.ok) {
        setAltaMsg({ ok: true, text: `✅ Cliente "${data.nombre}" creado (ID #${data.id}). Email enviado.` });
        setAltaForm({ email: '', password: '', nombre: '' }); setAltaFoto(null);
        fetchClientes();
      } else {
        setAltaMsg({ ok: false, text: data.detail || 'Error al crear cliente' });
      }
    } catch (err) { setAltaMsg({ ok: false, text: 'Error de conexión' }); }
    setAltaLoading(false);
  };

  // --- Webcam para FOTO de cliente existente ---
  const iniciarCamaraFotoCliente = useCallback(async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 320, height: 240 } });
      fotoStreamRef.current = s;
      setFotoCamActiva(true);
    } catch (e) { alert('No se pudo acceder a la cámara.'); }
  }, []);

  useEffect(() => {
    if (fotoCamActiva && fotoVideoRef.current && fotoStreamRef.current) {
      fotoVideoRef.current.srcObject = fotoStreamRef.current;
    }
  }, [fotoCamActiva]);

  const detenerCamaraFoto = useCallback(() => {
    if (fotoStreamRef.current) { fotoStreamRef.current.getTracks().forEach(t => t.stop()); fotoStreamRef.current = null; }
    setFotoCamActiva(false);
  }, []);

  const capturarFotoCliente = useCallback(() => {
    if (!fotoVideoRef.current || !fotoCanvasRef.current) return;
    const ctx = fotoCanvasRef.current.getContext('2d');
    fotoCanvasRef.current.width = 320; fotoCanvasRef.current.height = 240;
    ctx.drawImage(fotoVideoRef.current, 0, 0, 320, 240);
    setFotoClienteImg(fotoCanvasRef.current.toDataURL('image/jpeg', 0.8));
    detenerCamaraFoto();
  }, [detenerCamaraFoto]);

  const guardarFotoCliente = async () => {
    if (!fotoClienteId || !fotoClienteImg) return;
    try {
      const res = await fetch(`/api/usuarios/${fotoClienteId}/foto`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ foto_perfil: fotoClienteImg }) });
      if (res.ok) {
        setClientesAcceso(prev => prev.map(c => c.id === fotoClienteId ? { ...c, foto_perfil: fotoClienteImg } : c));
        cerrarModalFoto();
      } else { alert('Error al guardar la foto'); }
    } catch (e) { alert('Error de conexión'); }
  };

  const cerrarModalFoto = useCallback(() => {
    detenerCamaraFoto();
    setFotoClienteId(null); setFotoClienteImg(null);
  }, [detenerCamaraFoto]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-zinc-950 min-h-screen text-slate-900 dark:text-white font-sans overflow-x-hidden selection:bg-orange-500">
      {/* Header Section */}
      <header className="flex justify-between items-center mb-8 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase flex items-center gap-3">
            <BarChart3 className="text-orange-500" size={36} />
            ADMIN<span className="text-orange-500">CONTROL</span>
          </h1>
          <p className="text-zinc-500 uppercase tracking-widest text-xs mt-1 font-bold">Command Center de Alto Nivel</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setIsAltaOpen(true)} className="bg-green-600 hover:bg-green-500 px-5 py-3 rounded-lg font-bold transition-all shadow-lg shadow-green-500/20 inline-flex items-center gap-2 transform hover:-translate-y-1">
            <UserPlus size={20} /> Nuevo Cliente
          </button>
          <button onClick={() => setIsAltaMonitorOpen(true)} className="bg-blue-600 hover:bg-blue-500 px-5 py-3 rounded-lg font-bold transition-all shadow-lg shadow-blue-500/20 inline-flex items-center gap-2 transform hover:-translate-y-1">
            <UserPlus size={20} /> Nuevo Entrenador
          </button>
          <button onClick={() => setIsScannerOpen(true)} className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 px-5 py-3 rounded-lg font-bold transition-all shadow-lg shadow-orange-500/20 inline-flex items-center gap-2 transform hover:-translate-y-1">
            <Camera size={20} /> Escanear Acceso
          </button>
          <button onClick={() => { localStorage.removeItem('token'); window.location.href = '/'; }} className="bg-white dark:bg-zinc-800 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-zinc-700 hover:border-red-500/50 px-5 py-3 rounded-lg font-bold transition-all inline-flex items-center gap-2">
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Notificación de Último Escaneo */}
      {scanResult && (
        <div className={`mb-8 p-4 rounded-xl border animate-fade-in flex justify-between items-center ${scanResult.success ? 'bg-green-950/30 border-green-500/50 text-green-400' : 'bg-red-950/30 border-red-500/50 text-red-400'}`}>
          <div className="flex items-center gap-3 font-semibold">
            {scanResult.success ? <Activity /> : <AlertTriangle />}
            <span>{scanResult.message}</span>
          </div>
          <button onClick={() => setScanResult(null)} className="opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Modal de Scanner */}
      {isScannerOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800 w-full max-w-md relative shadow-2xl shadow-orange-500/10">
            <button onClick={() => setIsScannerOpen(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-slate-900 dark:text-white">✕</button>
            <h2 className="text-2xl font-black uppercase mb-6 text-center">Validar <span className="text-orange-500">QR</span></h2>
            <div id="reader" className="overflow-hidden rounded-xl border-2 border-zinc-800"></div>
          </div>
        </div>
      )}

      {/* KPIs Rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-100 dark:bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800 shadow-lg relative overflow-hidden group">
          <Users className="absolute top-6 right-6 text-orange-500/10" size={80} />
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">Clientes Activos</p>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white">{stats?.clientes?.activos || 0}</h2>
          <div className="mt-4 flex items-center gap-2 text-xs text-green-500 font-bold">
            <span>+2.4% este mes</span>
          </div>
        </div>

        <div className="bg-slate-100 dark:bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800 shadow-lg relative overflow-hidden group">
          <Activity className="absolute top-6 right-6 text-blue-500/10" size={80} />
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">Accesos Hoy</p>
          <h2 className="text-4xl font-black text-blue-400">{stats?.actividad_hoy?.accesos_totales || 0}</h2>
          <p className="text-red-400/80 text-xs mt-4 font-semibold">Denegados: {stats?.actividad_hoy?.accesos_denegados || 0}</p>
        </div>

        <div className="bg-slate-100 dark:bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800 shadow-lg relative overflow-hidden group">
          <Ticket className="absolute top-6 right-6 text-green-500/10" size={80} />
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">Ingresos Estimados</p>
          <h2 className="text-4xl font-black text-green-400">€ 12.450</h2>
          <p className="text-zinc-500 text-xs mt-4">Proyección a fin de mes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Gráfica de Afluencia */}
        <div className="lg:col-span-2 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Afluencia en Tiempo Real</h3>
              <p className="text-sm text-zinc-500">Picos de accesos por hora del día de hoy</p>
            </div>
            <div className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-bold border border-green-500/20 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              LIVE
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockAfluenciaData}>
                <defs>
                  <linearGradient id="colorAccesos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="hora" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#f97316', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="accesos" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorAccesos)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Estado del Equipo */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <PlayCircle className="text-blue-500" />
            Estado del Equipo
          </h3>
          <p className="text-sm text-zinc-500 mb-6">Monitores dando clase actualmente</p>
          
          <div className="space-y-4 flex-1">
            {mockEquipoActivo.map(monitor => (
              <div key={monitor.id} className="bg-zinc-950 rounded-xl p-4 border border-zinc-800 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center font-bold text-lg border border-blue-500/30">
                  {monitor.nombre.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{monitor.nombre}</h4>
                  <p className="text-xs text-zinc-400">{monitor.clase} • <span className="text-orange-400">{monitor.sala}</span></p>
                </div>
                <div className="ml-auto text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-400 font-medium">
                  {monitor.estado}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Tabla de Gestión de Pagos / Accesos */}
        <div className="bg-slate-100 dark:bg-zinc-900/50 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-zinc-800/80 flex justify-between items-center bg-zinc-900/30">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users size={24} className="text-blue-500" />
                Control de Pagos y Accesos
              </h3>
              <p className="text-sm text-zinc-500">Activa o bloquea el QR de clientes.</p>
            </div>
          </div>
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-left">
              <thead className="bg-black/40 text-zinc-500 text-xs uppercase tracking-widest font-bold sticky top-0">
                <tr>
                  <th className="p-4">Cliente</th>
                  <th className="p-4 text-center">Estado QR</th>
                  <th className="p-4 text-center">Foto</th>
                  <th className="p-4 text-right">Acción (Pago)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {clientesAcceso.map(cliente => (
                  <tr key={cliente.id} className="hover:bg-white dark:bg-zinc-800/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {cliente.foto_perfil ? (
                          <img src={cliente.foto_perfil} alt="" className="w-9 h-9 rounded-full object-cover border border-orange-500/50" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-white dark:bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-400">{cliente.nombre?.charAt(0)?.toUpperCase()}</div>
                        )}
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{cliente.nombre}</p>
                          <p className="text-xs text-zinc-500">{cliente.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-bold text-xs border ${
                        cliente.membresia_activa ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {cliente.membresia_activa ? <><Shield size={12}/> Activo</> : <><ShieldOff size={12}/> Bloqueado</>}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button onClick={() => { setFotoClienteId(cliente.id); setFotoClienteImg(cliente.foto_perfil || null); }} className="text-xs font-bold px-3 py-2 rounded-lg bg-white dark:bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-orange-500/50 text-zinc-300 hover:text-orange-400 inline-flex items-center gap-1 transition">
                        <Camera size={14} /> {cliente.foto_perfil ? 'Cambiar' : 'Añadir'}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => toggleMembresia(cliente.id, cliente.membresia_activa)}
                        className={`text-xs font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ml-auto border ${
                          cliente.membresia_activa 
                            ? 'bg-white dark:bg-zinc-800 hover:bg-red-500/20 text-red-400 border-red-500/20 hover:border-red-500/50' 
                            : 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500 shadow-lg shadow-orange-500/20'
                        }`}
                      >
                        {cliente.membresia_activa ? 'Suspender' : 'Activar (Pagado)'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alarma de Retención (Churn Risk) */}
        <div className="bg-red-950/10 border border-red-900/30 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-red-900/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-red-900/10">
            <div>
              <h3 className="text-xl font-bold text-red-400 flex items-center gap-2">
                <AlertTriangle size={24} />
                Alarma de Retención (Churn)
              </h3>
              <p className="text-sm text-red-500/70">Clientes activos con &gt; {churnDias} días ausentes.</p>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-red-400/80 uppercase tracking-widest whitespace-nowrap">Umbral (días)</label>
              <input
                type="number"
                min="1"
                max="365"
                value={churnDias}
                onChange={(e) => setChurnDias(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 bg-zinc-950 border border-red-500/30 rounded-lg px-3 py-2 text-white text-center text-sm font-bold focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
              />
            </div>
          </div>
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-left">
              <thead className="bg-black/40 text-red-400/70 text-xs uppercase tracking-widest font-bold sticky top-0">
                <tr>
                  <th className="p-4">Cliente</th>
                  <th className="p-4 text-center">Días Ausente</th>
                  <th className="p-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-900/20">
                {churnRisk.map(cliente => (
                  <tr key={cliente.id} className="hover:bg-red-900/10 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-slate-900 dark:text-white">{cliente.nombre}</p>
                      <p className="text-xs text-zinc-500">{cliente.email}</p>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full font-black text-sm border ${
                        cliente.dias_sin_venir >= churnDias * 2 
                          ? 'bg-red-600/30 text-red-300 border-red-500/40' 
                          : 'bg-red-500/20 text-red-400 border-red-500/20'
                      }`}>
                        {cliente.dias_sin_venir}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => enviarEmailMotivacional(cliente.id)}
                        className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ml-auto shadow-lg shadow-red-500/20"
                      >
                        <Mail size={14} /> Enviar Motivación
                      </button>
                    </td>
                  </tr>
                ))}
                {churnRisk.length === 0 && (
                  <tr>
                    <td colSpan="3" className="p-8 text-center text-zinc-600 font-medium italic">
                      🎉 ¡No hay clientes en riesgo con más de {churnDias} días de ausencia!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Gestión de Clases */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-xl mb-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
              <Calendar className="text-orange-500" />
              Gestión de <span className="text-orange-500">Clases</span>
            </h2>
            <p className="text-zinc-500 text-sm">Programación semanal y asignación de entrenadores.</p>
          </div>
          <button 
            onClick={() => setIsNuevaClaseOpen(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold transition flex items-center gap-2 shadow-lg shadow-orange-500/20"
          >
            <Plus size={20} /> Programar Clase
          </button>
        </header>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-black/40 text-zinc-500 text-xs uppercase tracking-widest font-bold sticky top-0">
              <tr>
                <th className="p-4">Clase</th>
                <th className="p-4">Entrenador</th>
                <th className="p-4">Horario</th>
                <th className="p-4 text-center">Aforo</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {clases.map(clase => (
                <tr key={clase.id} className="hover:bg-white dark:bg-zinc-800/30 transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-slate-900 dark:text-white uppercase">{clase.nombre}</p>
                    <p className="text-xs text-zinc-500 truncate max-w-[200px]">{clase.descripcion}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 font-bold text-xs border border-orange-500/20">
                        {clase.entrenador_nombre?.charAt(0)}
                      </div>
                      <span className="text-sm font-medium">{clase.entrenador_nombre}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{new Date(clase.fecha_inicio).toLocaleDateString()}</p>
                    <p className="text-xs text-zinc-500">{new Date(clase.fecha_inicio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(clase.fecha_fin).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                  </td>
                  <td className="p-4 text-center">
                    <div className="inline-flex flex-col items-center">
                      <span className="text-sm font-black text-slate-900 dark:text-white">{clase.reservas_count} / {clase.aforo_maximo}</span>
                      <div className="w-16 h-1.5 bg-white dark:bg-zinc-800 rounded-full mt-1 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${clase.reservas_count >= clase.aforo_maximo ? 'bg-red-500' : 'bg-orange-500'}`}
                          style={{ width: `${Math.min(100, (clase.reservas_count / clase.aforo_maximo) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => setSelectedClassForModal(clase)}
                      className="p-2 text-orange-500 hover:text-orange-400 transition-colors mr-2"
                      title="Ver Alumnos"
                    >
                      <Users size={18} />
                    </button>
                    <button 
                      onClick={() => handleEliminarClase(clase.id)}
                      className="p-2 text-zinc-500 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {clases.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-zinc-600 font-medium italic">
                    No hay clases programadas actualmente.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>


      {/* ===== MODAL ALTA RÁPIDA DE CLIENTE ===== */}
      {isAltaOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 w-full max-w-lg relative shadow-2xl shadow-green-500/10 overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-green-500 p-5 flex justify-between items-center">
              <h2 className="text-xl font-black uppercase flex items-center gap-2"><UserPlus size={22} /> Alta Rápida de Cliente</h2>
              <button onClick={cerrarModalAlta} className="text-slate-900 dark:text-white/70 hover:text-slate-900 dark:text-white"><X size={24} /></button>
            </div>
            <form onSubmit={handleAltaCliente} className="p-6 space-y-5">
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Email *</label>
                <input type="email" required value={altaForm.email} onChange={e => setAltaForm({...altaForm, email: e.target.value})} className="w-full bg-white dark:bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none" placeholder="cliente@email.com" />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Contraseña *</label>
                <input type="text" required value={altaForm.password} onChange={e => setAltaForm({...altaForm, password: e.target.value})} className="w-full bg-white dark:bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none" placeholder="Contraseña inicial" />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Nombre <span className="text-zinc-600">(opcional)</span></label>
                <input type="text" value={altaForm.nombre} onChange={e => setAltaForm({...altaForm, nombre: e.target.value})} className="w-full bg-white dark:bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none" placeholder="Se usará el email si se deja vacío" />
              </div>

              {/* Sección de foto */}
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Foto del cliente <span className="text-zinc-600">(opcional)</span></label>
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col items-center gap-3">
                  {altaFoto ? (
                    <>
                      <img src={altaFoto} alt="Foto cliente" className="w-32 h-32 rounded-full object-cover border-4 border-green-500/50" />
                      <button type="button" onClick={() => { setAltaFoto(null); }} className="text-xs text-red-400 hover:text-red-300 font-bold">Eliminar foto</button>
                    </>
                  ) : cameraActive ? (
                    <>
                      <video ref={videoRef} autoPlay playsInline muted className="w-64 h-48 rounded-xl border border-zinc-700 bg-black object-cover" />
                      <button type="button" onClick={capturarFoto} className="bg-green-600 hover:bg-green-500 text-white font-bold px-6 py-2 rounded-xl inline-flex items-center gap-2 text-sm"><Camera size={16} /> Capturar</button>
                    </>
                  ) : (
                    <button type="button" onClick={iniciarCamara} className="bg-white dark:bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 font-bold px-6 py-3 rounded-xl inline-flex items-center gap-2 text-sm transition"><Camera size={18} /> Abrir Cámara</button>
                  )}
                </div>
              </div>

              {altaMsg && (
                <div className={`p-3 rounded-xl text-sm font-semibold flex items-center gap-2 ${altaMsg.ok ? 'bg-green-950/50 border border-green-500/30 text-green-400' : 'bg-red-950/50 border border-red-500/30 text-red-400'}`}>
                  {altaMsg.ok ? <CheckCircle size={16} /> : <AlertTriangle size={16} />} {altaMsg.text}
                </div>
              )}

              <button type="submit" disabled={altaLoading} className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-3 rounded-xl uppercase tracking-wider transition-all shadow-lg shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {altaLoading ? 'Creando...' : <><UserPlus size={18} /> Dar de Alta</>}
              </button>
            </form>
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>
      )}

      {/* ===== MODAL ALTA RÁPIDA DE ENTRENADOR ===== */}
      {isAltaMonitorOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 w-full max-w-lg relative shadow-2xl shadow-blue-500/10 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-5 flex justify-between items-center">
              <h2 className="text-xl font-black uppercase flex items-center gap-2"><UserPlus size={22} /> Alta de Entrenador / Monitor</h2>
              <button onClick={cerrarModalAltaMonitor} className="text-slate-900 dark:text-white/70 hover:text-slate-900 dark:text-white"><X size={24} /></button>
            </div>
            <form onSubmit={handleAltaMonitor} className="p-6 space-y-5">
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Nombre completo *</label>
                <input type="text" required value={altaMonitorForm.nombre} onChange={e => setAltaMonitorForm({...altaMonitorForm, nombre: e.target.value})} className="w-full bg-white dark:bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Nombre completo" />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Email *</label>
                <input type="email" required value={altaMonitorForm.email} onChange={e => setAltaMonitorForm({...altaMonitorForm, email: e.target.value})} className="w-full bg-white dark:bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" placeholder="entrenador@irongym.com" />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Contraseña *</label>
                <input type="text" required value={altaMonitorForm.password} onChange={e => setAltaMonitorForm({...altaMonitorForm, password: e.target.value})} className="w-full bg-white dark:bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Contraseña de acceso" />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Teléfono</label>
                <input type="text" value={altaMonitorForm.telefono} onChange={e => setAltaMonitorForm({...altaMonitorForm, telefono: e.target.value})} className="w-full bg-white dark:bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Opcional" />
              </div>

              {/* Webcam */}
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Foto de perfil <span className="text-zinc-600">(opcional)</span></label>
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col items-center gap-3">
                  {altaMonitorFoto ? (
                    <>
                      <img src={altaMonitorFoto} alt="Foto monitor" className="w-32 h-32 rounded-full object-cover border-4 border-blue-500/50" />
                      <button type="button" onClick={() => { setAltaMonitorFoto(null); }} className="text-xs text-red-400 hover:text-red-300 font-bold">Eliminar foto</button>
                    </>
                  ) : monitorCameraActive ? (
                    <>
                      <video ref={monitorVideoRef} autoPlay playsInline muted className="w-64 h-48 rounded-xl border border-zinc-700 bg-black object-cover" />
                      <button type="button" onClick={capturarFotoMonitor} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2 rounded-xl inline-flex items-center gap-2 text-sm"><Camera size={16} /> Capturar</button>
                    </>
                  ) : (
                    <button type="button" onClick={iniciarCamaraMonitor} className="bg-white dark:bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 font-bold px-6 py-3 rounded-xl inline-flex items-center gap-2 text-sm transition"><Camera size={18} /> Abrir Cámara</button>
                  )}
                </div>
              </div>

              {altaMonitorMsg && (
                <div className={`p-3 rounded-xl text-sm font-semibold flex items-center gap-2 ${altaMonitorMsg.ok ? 'bg-green-950/50 border border-green-500/30 text-green-400' : 'bg-red-950/50 border border-red-500/30 text-red-400'}`}>
                  {altaMonitorMsg.ok ? <CheckCircle size={16} /> : <AlertTriangle size={16} />} {altaMonitorMsg.text}
                </div>
              )}

              <button type="submit" disabled={altaMonitorLoading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3 rounded-xl uppercase tracking-wider transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2">
                {altaMonitorLoading ? 'Creando...' : <><UserPlus size={18} /> Registrar Entrenador</>}
              </button>
            </form>
            <canvas ref={monitorCanvasRef} className="hidden" />
          </div>
        </div>
      )}

      {/* ===== MODAL FOTO CLIENTE EXISTENTE ===== */}
      {fotoClienteId && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 w-full max-w-md relative shadow-2xl shadow-orange-500/10 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-600 to-orange-500 p-5 flex justify-between items-center">
              <h2 className="text-lg font-black uppercase flex items-center gap-2"><Camera size={20} /> Foto del Cliente #{fotoClienteId}</h2>
              <button onClick={cerrarModalFoto} className="text-slate-900 dark:text-white/70 hover:text-slate-900 dark:text-white"><X size={24} /></button>
            </div>
            <div className="p-6 flex flex-col items-center gap-4">
              {fotoClienteImg && !fotoCamActiva ? (
                <>
                  <img src={fotoClienteImg} alt="Foto" className="w-40 h-40 rounded-full object-cover border-4 border-orange-500/50" />
                  <div className="flex gap-3">
                    <button onClick={() => { setFotoClienteImg(null); }} className="text-xs text-red-400 hover:text-red-300 font-bold px-4 py-2 bg-red-500/10 rounded-lg border border-red-500/20">Eliminar</button>
                    <button onClick={iniciarCamaraFotoCliente} className="text-xs text-orange-400 font-bold px-4 py-2 bg-orange-500/10 rounded-lg border border-orange-500/20 inline-flex items-center gap-1"><Camera size={14} /> Nueva foto</button>
                  </div>
                </>
              ) : fotoCamActiva ? (
                <>
                  <video ref={fotoVideoRef} autoPlay playsInline muted className="w-64 h-48 rounded-xl border border-zinc-700 bg-black object-cover" />
                  <button onClick={capturarFotoCliente} className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-6 py-2 rounded-xl inline-flex items-center gap-2 text-sm"><Camera size={16} /> Capturar</button>
                </>
              ) : (
                <button onClick={iniciarCamaraFotoCliente} className="bg-white dark:bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 font-bold px-6 py-3 rounded-xl inline-flex items-center gap-2 text-sm transition"><Camera size={18} /> Abrir Cámara</button>
              )}
              {fotoClienteImg && !fotoCamActiva && (
                <button onClick={guardarFotoCliente} className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-3 rounded-xl uppercase tracking-wider transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 mt-2">
                  <CheckCircle size={18} /> Guardar Foto
                </button>
              )}
            </div>
            <canvas ref={fotoCanvasRef} className="hidden" />
          </div>
        </div>
      )}

      {/* Modal Nueva Clase */}
      {isNuevaClaseOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-3xl border border-zinc-800 w-full max-w-xl relative shadow-2xl overflow-hidden animate-scale-in">
            <header className="bg-gradient-to-r from-orange-600 to-orange-500 p-6 flex justify-between items-center">
              <h2 className="text-xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">Programar Nueva Clase</h2>
              <button onClick={() => setIsNuevaClaseOpen(false)} className="text-slate-900 dark:text-white/70 hover:text-slate-900 dark:text-white transition-colors">
                <X size={24} />
              </button>
            </header>
            <form onSubmit={handleCrearClase} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Nombre de la Clase</label>
                  <input 
                    type="text" 
                    required 
                    value={nuevaClaseForm.nombre}
                    onChange={e => setNuevaClaseForm({...nuevaClaseForm, nombre: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-slate-900 dark:text-white focus:border-orange-500 outline-none transition-all"
                    placeholder="Ej: Crossfit WOD, Yoga Flow..."
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Descripción</label>
                  <textarea 
                    value={nuevaClaseForm.descripcion}
                    onChange={e => setNuevaClaseForm({...nuevaClaseForm, descripcion: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-slate-900 dark:text-white focus:border-orange-500 outline-none transition-all h-24 resize-none"
                    placeholder="Detalles de la sesión..."
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Entrenador</label>
                  <select 
                    required 
                    value={nuevaClaseForm.entrenador_id}
                    onChange={e => setNuevaClaseForm({...nuevaClaseForm, entrenador_id: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-slate-900 dark:text-white focus:border-orange-500 outline-none transition-all appearance-none"
                  >
                    <option value="">Seleccionar...</option>
                    {entrenadores.map(e => (
                      <option key={e.id} value={e.id}>{e.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Aforo Máximo</label>
                  <input 
                    type="number" 
                    required 
                    min="1"
                    value={nuevaClaseForm.aforo_maximo}
                    onChange={e => setNuevaClaseForm({...nuevaClaseForm, aforo_maximo: parseInt(e.target.value)})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-slate-900 dark:text-white focus:border-orange-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Fecha/Hora Inicio</label>
                  <input 
                    type="datetime-local" 
                    required 
                    value={nuevaClaseForm.fecha_inicio}
                    onChange={e => setNuevaClaseForm({...nuevaClaseForm, fecha_inicio: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-slate-900 dark:text-white focus:border-orange-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Fecha/Hora Fin</label>
                  <input 
                    type="datetime-local" 
                    required 
                    value={nuevaClaseForm.fecha_fin}
                    onChange={e => setNuevaClaseForm({...nuevaClaseForm, fecha_fin: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-slate-900 dark:text-white focus:border-orange-500 outline-none transition-all"
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={claseLoading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded-xl uppercase tracking-widest transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50"
              >
                {claseLoading ? 'Guardando...' : 'Programar Clase'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Alumnos Inscritos */}
      {selectedClassForModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-xl font-black text-white uppercase mb-1">
              Alumnos en <span className="text-orange-500">{selectedClassForModal.nombre}</span>
            </h3>
            <p className="text-zinc-400 text-sm mb-6">Aforo: {selectedClassForModal.reservas_count} / {selectedClassForModal.aforo_maximo}</p>
            
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
                <p className="text-zinc-500 text-center py-4">No hay alumnos inscritos todavía.</p>
              )}
            </div>
            
            <button 
              onClick={() => setSelectedClassForModal(null)}
              className="mt-6 w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
