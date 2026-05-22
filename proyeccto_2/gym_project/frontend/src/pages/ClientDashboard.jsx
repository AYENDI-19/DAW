import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { Flame, AlertCircle, CreditCard, Activity, Calendar, User, Users, CheckCircle, Download, Trophy, Link, Gift, Share2, Copy, X, Edit2, Trash2, Plus, Film, Image, Eye } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ClientDashboard() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [vistaActiva, setVistaActiva] = useState('resumen');
  const [clases, setClases] = useState([]);
  const [rutinas, setRutinas] = useState([]);
  const [progresoData, setProgresoData] = useState([]);
  const [racha, setRacha] = useState(0);
  const [mensajeGlobal, setMensajeGlobal] = useState(null);
  const [linkCopiado, setLinkCopiado] = useState(false);

  // Pasarela de Pago
  const [isPagoOpen, setIsPagoOpen] = useState(false);
  const [metodoPago, setMetodoPago] = useState('stripe');
  const [planSeleccionado, setPlanSeleccionado] = useState('mensual');
  const [pagoLoading, setPagoLoading] = useState(false);

  // Historial de ejercicios y Rutinas de Cliente
  const [historialEjercicios, setHistorialEjercicios] = useState([]);
  const [registroInputs, setRegistroInputs] = useState({});
  const [selectedExercise, setSelectedExercise] = useState('');

  // Crear Rutina
  const [isCrearRutinaOpen, setIsCrearRutinaOpen] = useState(false);
  const [nuevaRutinaNombre, setNuevaRutinaNombre] = useState('');
  const [nuevaRutinaDescripcion, setNuevaRutinaDescripcion] = useState('');
  const [nuevaRutinaEjercicios, setNuevaRutinaEjercicios] = useState([
    { nombre_ejercicio: '', series: 4, repeticiones: '10', peso_sugerido: 0, descanso_segundos: 90, multimedia: '' }
  ]);

  // Editar Historial Log
  const [isEditHistoryOpen, setIsEditHistoryOpen] = useState(false);
  const [editingHistoryEntry, setEditingHistoryEntry] = useState(null);
  const [editWeight, setEditWeight] = useState(0);
  const [editSeries, setEditSeries] = useState(4);
  const [editReps, setEditReps] = useState('10');
  const [editExerciseName, setEditExerciseName] = useState('');

  // Registro Manual de Historial
  const [isManualLogOpen, setIsManualLogOpen] = useState(false);
  const [manualExerciseName, setManualExerciseName] = useState('');
  const [manualWeight, setManualWeight] = useState(0);
  const [manualSeries, setManualSeries] = useState(4);
  const [manualReps, setManualReps] = useState('10');

  // Lightbox multimedia
  const [activeMediaUrl, setActiveMediaUrl] = useState(null);

  // MOCK de medallas (Idealmente provienen del endpoint del usuario)
  const medallas = [
    { id: 1, nombre: 'Titán', descripcion: 'Entrena 5 días seguidos', icono: '🔥', progreso: 100, desbloqueada: true },
    { id: 2, nombre: 'Madrugador', descripcion: 'Entrena antes de las 7:00 AM', icono: '🌅', progreso: 100, desbloqueada: true },
    { id: 3, nombre: 'Levantador Épico', descripcion: 'Registra un PR en Sentadilla', icono: '🏋️', progreso: 60, desbloqueada: false },
    { id: 4, nombre: 'Alma de la Fiesta', descripcion: 'Reserva 10 clases grupales', icono: '🕺', progreso: 20, desbloqueada: false },
  ];

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    const cargarDatosCliente = async () => {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const emailLogueado = payload.sub;

        const resUsuarios = await fetch('/api/usuarios');
        if (resUsuarios.ok) {
          const listaUsuarios = await resUsuarios.json();
          const clienteActual = listaUsuarios.find((u) => u.email === emailLogueado);

          if (!clienteActual || clienteActual.rol !== 'cliente') {
            navigate('/');
            return;
          }
          setUsuario(clienteActual);
          setRacha(clienteActual.racha_asistencias || 5); // Fallback a 5

          const resClases = await fetch('/api/clases');
          if (resClases.ok) setClases(await resClases.json());

          const resRutinas = await fetch(`/api/rutinas/cliente/${clienteActual.id}`);
          if (resRutinas.ok) setRutinas(await resRutinas.json());

          // Cargar historial de ejercicios
          await cargarHistorial(clienteActual.id);

          try {
            const resProgreso = await fetch(`/api/progreso/cliente/${clienteActual.id}`);
            if (resProgreso.ok) {
              const data = await resProgreso.json();
              if (data.length > 0) setProgresoData(data);
              else fallBackProgreso();
            }
          } catch(e) {
            fallBackProgreso();
          }
        }
      } catch (error) {
        console.error('Error validando token:', error);
        localStorage.removeItem('token');
        navigate('/');
      }
    };
    cargarDatosCliente();
  }, [navigate]);

  const fallBackProgreso = () => {
    setProgresoData([
      { fecha: '01/05', peso: 5, reps: 8 },
      { fecha: '02/05', peso: 7.5, reps: 10 },
      { fecha: '04/05', peso: 7.5, reps: 12 },
      { fecha: '06/05', peso: 10, reps: 8 },
    ]);
  };

  const handleReservar = async (claseId) => {
    try {
      const respuesta = await fetch('/api/reservas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: usuario.id, clase_id: claseId }),
      });

      if (respuesta.ok) {
        setMensajeGlobal({ tipo: 'exito', texto: '¡Plaza reservada con éxito!' });
      } else {
        const error = await respuesta.json();
        setMensajeGlobal({ tipo: 'error', texto: error.detail || 'Error en la reserva' });
      }
      setTimeout(() => setMensajeGlobal(null), 3000);
    } catch (error) {
      setMensajeGlobal({ tipo: 'error', texto: 'Error de conexión.' });
    }
  };

  const cargarHistorial = async (clienteId) => {
    try {
      const res = await fetch(`/api/historial-ejercicios/cliente/${clienteId}`);
      if (res.ok) {
        const data = await res.json();
        setHistorialEjercicios(data);
      }
    } catch (e) {
      console.error('Error al cargar el historial:', e);
    }
  };

  const handleRegistrarProgresoReal = async (ejercicioNombre, key, defaultSeries) => {
    const inputs = registroInputs[key] || {};
    const pesoVal = parseInt(inputs.peso) || 0;
    const repsVal = inputs.reps || '';

    if (pesoVal <= 0 || !repsVal.trim()) {
      setMensajeGlobal({ tipo: 'error', texto: 'Por favor, introduce peso y repeticiones válidos.' });
      setTimeout(() => setMensajeGlobal(null), 3000);
      return;
    }

    try {
      const res = await fetch('/api/historial-ejercicios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_id: usuario.id,
          ejercicio_nombre: ejercicioNombre,
          peso: pesoVal,
          series: parseInt(defaultSeries) || 4,
          repeticiones: String(repsVal)
        })
      });

      if (res.ok) {
        setMensajeGlobal({ tipo: 'exito', texto: `¡Progreso de ${ejercicioNombre} registrado en el historial!` });
        await cargarHistorial(usuario.id);
        setRegistroInputs(prev => ({
          ...prev,
          [key]: { peso: '', reps: '' }
        }));
      } else {
        setMensajeGlobal({ tipo: 'error', texto: 'Error al registrar progreso en la base de datos.' });
      }
    } catch(err) {
      setMensajeGlobal({ tipo: 'error', texto: 'Error de red al registrar progreso.' });
    }
    setTimeout(() => setMensajeGlobal(null), 3000);
  };

  const handleCrearRutina = async (e) => {
    e.preventDefault();
    if (!nuevaRutinaNombre.trim()) {
      setMensajeGlobal({ tipo: 'error', texto: 'Por favor, introduce un nombre para la rutina.' });
      setTimeout(() => setMensajeGlobal(null), 3000);
      return;
    }

    try {
      const payload = {
        cliente_id: usuario.id,
        nombre: nuevaRutinaNombre,
        descripcion: nuevaRutinaDescripcion || '',
        ejercicios: nuevaRutinaEjercicios.map(ej => ({
          nombre_ejercicio: ej.nombre_ejercicio,
          series: parseInt(ej.series) || 4,
          repeticiones: String(ej.repeticiones),
          descanso_segundos: parseInt(ej.descanso_segundos) || 90,
          peso_sugerido: parseInt(ej.peso_sugerido) || 0,
          multimedia: ej.multimedia || null
        }))
      };

      const res = await fetch('/api/rutinas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setMensajeGlobal({ tipo: 'exito', texto: '¡Rutina creada con éxito!' });
        setIsCrearRutinaOpen(false);
        setNuevaRutinaNombre('');
        setNuevaRutinaDescripcion('');
        setNuevaRutinaEjercicios([{ nombre_ejercicio: '', series: 4, repeticiones: '10', peso_sugerido: 0, descanso_segundos: 90, multimedia: '' }]);
        
        const resRutinas = await fetch(`/api/rutinas/cliente/${usuario.id}`);
        if (resRutinas.ok) setRutinas(await resRutinas.json());
      } else {
        const err = await res.json();
        setMensajeGlobal({ tipo: 'error', texto: err.detail || 'Error al crear la rutina.' });
      }
    } catch(e) {
      setMensajeGlobal({ tipo: 'error', texto: 'Error de red.' });
    }
    setTimeout(() => setMensajeGlobal(null), 3000);
  };

  const handleEliminarRutina = async (rutinaId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta rutina?')) return;
    try {
      const res = await fetch(`/api/rutinas/${rutinaId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setMensajeGlobal({ tipo: 'exito', texto: 'Rutina eliminada correctamente' });
        setRutinas(prev => prev.filter(r => r.id !== rutinaId));
      } else {
        setMensajeGlobal({ tipo: 'error', texto: 'Error al eliminar la rutina' });
      }
    } catch(e) {
      setMensajeGlobal({ tipo: 'error', texto: 'Error de red' });
    }
    setTimeout(() => setMensajeGlobal(null), 3000);
  };

  const handleEliminarRegistroHistorial = async (logId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este registro de historial?')) return;
    try {
      const res = await fetch(`/api/historial-ejercicios/${logId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setMensajeGlobal({ tipo: 'exito', texto: 'Registro eliminado correctamente' });
        setHistorialEjercicios(prev => prev.filter(h => h.id !== logId));
      } else {
        setMensajeGlobal({ tipo: 'error', texto: 'Error al eliminar el registro' });
      }
    } catch(e) {
      setMensajeGlobal({ tipo: 'error', texto: 'Error de red' });
    }
    setTimeout(() => setMensajeGlobal(null), 3000);
  };

  const openEditarHistorial = (log) => {
    setEditingHistoryEntry(log);
    setEditExerciseName(log.ejercicio_nombre);
    setEditWeight(log.peso);
    setEditSeries(log.series);
    setEditReps(log.repeticiones);
    setIsEditHistoryOpen(true);
  };

  const handleSaveEditHistory = async (e) => {
    e.preventDefault();
    if (!editExerciseName.trim() || editWeight <= 0) {
      setMensajeGlobal({ tipo: 'error', texto: 'Por favor rellene los campos obligatorios.' });
      setTimeout(() => setMensajeGlobal(null), 3000);
      return;
    }
    try {
      const res = await fetch(`/api/historial-ejercicios/${editingHistoryEntry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ejercicio_nombre: editExerciseName,
          peso: parseInt(editWeight) || 0,
          series: parseInt(editSeries) || 4,
          repeticiones: String(editReps)
        })
      });
      if (res.ok) {
        setMensajeGlobal({ tipo: 'exito', texto: 'Historial actualizado correctamente' });
        setIsEditHistoryOpen(false);
        await cargarHistorial(usuario.id);
      } else {
        setMensajeGlobal({ tipo: 'error', texto: 'Error al actualizar el historial' });
      }
    } catch(e) {
      setMensajeGlobal({ tipo: 'error', texto: 'Error de red' });
    }
    setTimeout(() => setMensajeGlobal(null), 3000);
  };

  const handleManualLog = async (e) => {
    e.preventDefault();
    if (!manualExerciseName.trim() || manualWeight <= 0) {
      setMensajeGlobal({ tipo: 'error', texto: 'Por favor rellene los campos obligatorios.' });
      setTimeout(() => setMensajeGlobal(null), 3000);
      return;
    }
    try {
      const res = await fetch('/api/historial-ejercicios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_id: usuario.id,
          ejercicio_nombre: manualExerciseName,
          peso: parseInt(manualWeight) || 0,
          series: parseInt(manualSeries) || 4,
          repeticiones: String(manualReps)
        })
      });
      if (res.ok) {
        setMensajeGlobal({ tipo: 'exito', texto: 'Ejercicio añadido al historial' });
        setIsManualLogOpen(false);
        setManualExerciseName('');
        setManualWeight(0);
        setManualSeries(4);
        setManualReps('10');
        await cargarHistorial(usuario.id);
      } else {
        setMensajeGlobal({ tipo: 'error', texto: 'Error al guardar el registro' });
      }
    } catch(e) {
      setMensajeGlobal({ tipo: 'error', texto: 'Error de red' });
    }
    setTimeout(() => setMensajeGlobal(null), 3000);
  };

  const handleRenovar = () => {
    setIsPagoOpen(true);
  };

  const procesarPago = async (e) => {
    e.preventDefault();
    setPagoLoading(true);
    try {
      const res = await fetch(`/api/usuarios/${usuario.id}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membresia_activa: true })
      });
      if (res.ok) {
        const data = await res.json();
        setUsuario(data);
        setMensajeGlobal({ tipo: 'exito', texto: `¡Membresía renovada con éxito vía ${metodoPago.toUpperCase()}!` });
        setIsPagoOpen(false);
      } else {
        setMensajeGlobal({ tipo: 'error', texto: 'Error al procesar la renovación' });
      }
    } catch (err) {
      setMensajeGlobal({ tipo: 'error', texto: 'Error de conexión con la pasarela de pago' });
    }
    setPagoLoading(false);
    setTimeout(() => setMensajeGlobal(null), 4000);
  };

  const copiarEnlaceReferido = () => {
    const link = `https://irongym.com/registro?ref=${usuario.id}IRON`;
    navigator.clipboard.writeText(link);
    setLinkCopiado(true);
    setTimeout(() => setLinkCopiado(false), 3000);
  };

  const descargarRutinaPDF = (rutina) => {
    const doc = new jsPDF();
    
    doc.setFillColor(249, 115, 22);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("IRON GYM", 105, 20, { align: "center" });
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.text(`Plan de Entrenamiento: ${rutina.nombre}`, 105, 30, { align: "center" });
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`Atleta: ${usuario.nombre}`, 14, 55);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 62);
    
    const tableColumn = ["Ejercicio", "Series", "Repeticiones", "Peso Sugerido (kg)"];
    const tableRows = [];

    if (rutina.ejercicios) {
      rutina.ejercicios.forEach(ej => {
        const rowData = [
          ej.nombre_ejercicio,
          ej.series.toString(),
          ej.repeticiones,
          ej.peso_sugerido ? ej.peso_sugerido.toString() : "-"
        ];
        tableRows.push(rowData);
      });
    }

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 75,
      theme: 'grid',
      headStyles: { fillColor: [249, 115, 22], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 11, cellPadding: 6 },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    doc.save(`Rutina_${rutina.nombre.replace(/\s+/g, '_')}.pdf`);
    setMensajeGlobal({ tipo: 'exito', texto: 'Descarga de PDF iniciada.' });
    setTimeout(() => setMensajeGlobal(null), 3000);
  };

  if (!usuario) {
    return (
      <div className="h-screen bg-zinc-950 flex flex-col items-center justify-center text-orange-500">
        <Activity size={48} className="animate-pulse mb-4" />
        <span className="text-xl font-bold tracking-widest uppercase">Cargando Iron Gym...</span>
      </div>
    );
  }

  let diasRestantes = 0;
  if (usuario.fecha_fin_membresia) {
    const fin = new Date(usuario.fecha_fin_membresia);
    const hoy = new Date();
    diasRestantes = Math.ceil((fin - hoy) / (1000 * 60 * 60 * 24));
  }
  const necesitaRenovar = !usuario.membresia_activa || diasRestantes <= 3;

  return (
    <div className="flex h-screen bg-zinc-950 text-slate-900 dark:text-white font-sans selection:bg-orange-500">
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col shadow-2xl z-10">
        <div className="p-6 border-b border-zinc-800 text-center">
          {usuario.foto_perfil ? (
            <img src={usuario.foto_perfil} alt={usuario.nombre} className="w-16 h-16 rounded-full mx-auto mb-3 object-cover border-2 border-orange-500 shadow-lg shadow-orange-500/20" />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-tr from-orange-600 to-orange-400 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-black shadow-lg shadow-orange-500/20">
              {usuario.nombre.charAt(0).toUpperCase()}
            </div>
          )}
          <h2 className="font-bold truncate text-slate-900 dark:text-white">{usuario.nombre}</h2>
        
        </div>
        
        <nav className="flex-1 p-4 space-y-2 mt-4">
          <button
            onClick={() => setVistaActiva('resumen')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${vistaActiva === 'resumen' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' : 'hover:bg-white dark:bg-zinc-800 text-zinc-400 hover:text-slate-900 dark:text-white'}`}
          >
            <User size={20} /> Dashboard
          </button>
          <button
            onClick={() => setVistaActiva('rutinas')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${vistaActiva === 'rutinas' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' : 'hover:bg-white dark:bg-zinc-800 text-zinc-400 hover:text-slate-900 dark:text-white'}`}
          >
            <Activity size={20} /> Mis Rutinas
          </button>
          <button
            onClick={() => setVistaActiva('historial_rutinas')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${vistaActiva === 'historial_rutinas' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' : 'hover:bg-white dark:bg-zinc-800 text-zinc-400 hover:text-slate-900 dark:text-white'}`}
          >
            <Activity size={20} /> Historial y Pesos
          </button>
          <button
            onClick={() => setVistaActiva('progreso')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${vistaActiva === 'progreso' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' : 'hover:bg-white dark:bg-zinc-800 text-zinc-400 hover:text-slate-900 dark:text-white'}`}
          >
            <Activity size={20} /> Progreso
          </button>
          <button
            onClick={() => setVistaActiva('clases')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${vistaActiva === 'clases' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' : 'hover:bg-white dark:bg-zinc-800 text-zinc-400 hover:text-slate-900 dark:text-white'}`}
          >
            <Calendar size={20} /> Reservas
          </button>
          <button
            onClick={() => setVistaActiva('gamificacion')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${vistaActiva === 'gamificacion' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' : 'hover:bg-white dark:bg-zinc-800 text-zinc-400 hover:text-slate-900 dark:text-white'}`}
          >
            <Trophy size={20} /> Logros y Referidos
          </button>
        </nav>
        <div className="p-4 border-t border-zinc-800">
          <button
            onClick={() => {
              localStorage.removeItem('token');
              navigate('/');
            }}
            className="w-full py-3 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition font-medium flex items-center justify-center gap-2"
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto bg-zinc-950/50 relative">
        {mensajeGlobal && (
          <div className={`fixed top-8 right-8 px-6 py-4 rounded-xl shadow-2xl z-50 animate-fade-in flex items-center gap-3 border ${
              mensajeGlobal.tipo === 'exito' ? 'bg-green-950/90 border-green-500/50 text-green-400' : 
              mensajeGlobal.tipo === 'info' ? 'bg-blue-950/90 border-blue-500/50 text-blue-400' : 
              'bg-red-950/90 border-red-500/50 text-red-400'
            }`}
          >
            {mensajeGlobal.tipo === 'exito' && <CheckCircle />}
            {mensajeGlobal.tipo === 'info' && <CreditCard />}
            {mensajeGlobal.tipo === 'error' && <AlertCircle />}
            <span className="font-semibold">{mensajeGlobal.texto}</span>
          </div>
        )}

        <div className="max-w-5xl mx-auto mb-8 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div className="bg-gradient-to-r from-orange-500/20 to-red-500/10 border border-orange-500/30 px-6 py-3 rounded-2xl flex items-center gap-4 animate-fade-in">
              <div className="bg-orange-500/20 p-2 rounded-full text-orange-500 animate-pulse">
                <Flame size={28} />
              </div>
              <div>
                <p className="text-xs text-orange-500/80 font-black uppercase tracking-widest">Compromiso</p>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Racha actual: <span className="text-orange-500">{racha} días</span> 🔥</h3>
              </div>
            </div>

            {necesitaRenovar && (
              <div className="bg-red-500/10 border border-red-500/50 px-6 py-4 rounded-2xl flex flex-col sm:flex-row items-center gap-6 animate-fade-in w-full md:w-auto shadow-lg shadow-red-500/5">
                <div>
                  <h4 className="text-red-500 font-bold flex items-center gap-2">
                    <AlertCircle size={18} /> 
                    {!usuario.membresia_activa ? 'Membresía Inactiva' : `Expira en ${diasRestantes} días`}
                  </h4>
                  <p className="text-xs text-zinc-400 mt-1">Renueva para no perder el acceso ni tu racha.</p>
                </div>
                <button 
                  onClick={handleRenovar}
                  className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-6 rounded-xl transition shadow-lg shadow-red-600/30 whitespace-nowrap flex items-center gap-2"
                >
                  <CreditCard size={18} /> Renovar Membresía
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="max-w-5xl mx-auto">
          {vistaActiva === 'resumen' && (
            <div className="animate-fade-in">
              <div className="relative h-48 rounded-[2.5rem] overflow-hidden mb-8 shadow-2xl border-2 border-zinc-800">
                <img src="/assets/gym_workout.png" alt="Workout" className="w-full h-full object-cover opacity-70 mix-blend-lighten" />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent"></div>
                <div className="absolute bottom-6 left-8">
                  <h2 className="text-4xl font-black italic uppercase tracking-tight text-slate-900 dark:text-white drop-shadow-md">
                    BIENVENIDO AL <span className="text-orange-500">TEMPLO</span>
                  </h2>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                <h1 className="text-4xl font-black tracking-tighter uppercase">
                  IRON<span className="text-orange-500">PASS</span>
                </h1>
                <div className={`p-8 rounded-3xl border transition-all ${usuario.membresia_activa ? 'bg-green-950/20 border-green-500/30' : 'bg-red-950/20 border-red-500/30'}`}>
                  <p className="text-sm font-bold text-zinc-500 mb-2 uppercase tracking-widest">Estado</p>
                  <span className={`text-4xl font-black ${usuario.membresia_activa ? 'text-green-500' : 'text-red-500'}`}>
                    {usuario.membresia_activa ? 'ACTIVA' : 'INACTIVA'}
                  </span>
                  <p className="mt-4 text-zinc-400 font-medium">
                    Vence el:{' '}
                    <span className="text-slate-900 dark:text-white">
                      {usuario.fecha_fin_membresia ? new Date(usuario.fecha_fin_membresia).toLocaleDateString() : '--/--/----'}
                    </span>
                  </p>
                </div>
              </div>

              <div className={`bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] flex flex-col items-center justify-center shadow-2xl relative overflow-hidden ${!usuario.membresia_activa ? 'opacity-75' : ''}`}>
                <div className={`absolute top-0 left-0 w-full h-2 ${usuario.membresia_activa ? 'bg-orange-500' : 'bg-red-600'}`}></div>
                <p className="text-xs text-zinc-500 font-black uppercase mb-6 tracking-widest">Scanner ID</p>
                <div className={`p-4 bg-white rounded-3xl ${!usuario.membresia_activa ? 'opacity-50 blur-[2px]' : ''} relative`}>
                  <QRCodeSVG
                    value={JSON.stringify({ usuario_id: usuario.id, timestamp: Date.now() })}
                    size={180}
                  />
                  {!usuario.membresia_activa && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-3xl backdrop-blur-sm">
                      <AlertCircle className="text-red-500 w-16 h-16" />
                    </div>
                  )}
                </div>
                <p className="mt-6 font-black text-slate-900 dark:text-white text-2xl tracking-tight uppercase">{usuario.nombre}</p>
                <p className="text-xs text-orange-500 mt-1 font-bold">Muestra esto al entrar</p>
              </div>
            </div>
            </div>
          )}

          {vistaActiva === 'gamificacion' && (
            <div className="space-y-12 animate-fade-in">
              <header>
                <h1 className="text-3xl font-black tracking-tighter uppercase">
                  Logros & <span className="text-orange-500">Recompensas</span>
                </h1>
                <p className="text-zinc-400">Gana medallas y días gratis invitando a tus amigos.</p>
              </header>

              {/* Referidos */}
              <div className="bg-gradient-to-br from-orange-600 to-orange-500 rounded-3xl p-8 shadow-xl shadow-orange-500/20 text-slate-900 dark:text-white relative overflow-hidden">
                <Gift className="absolute top-8 right-8 text-slate-900 dark:text-white/10" size={120} />
                <div className="relative z-10 max-w-2xl">
                  <h3 className="text-2xl font-black uppercase tracking-tight mb-2 flex items-center gap-3">
                    <Share2 size={28} /> Invita y Gana
                  </h3>
                  <p className="text-orange-100 font-medium text-lg mb-6 leading-relaxed">
                    Por cada amigo que se registre usando tu enlace y adquiera una membresía, 
                    <span className="font-black bg-white/20 px-2 py-1 rounded inline-block mx-1">ganarás 15 DÍAS GRATIS</span> adicionales.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className="bg-black/30 border border-white/20 px-4 py-3 rounded-xl flex-1 w-full text-orange-100 font-mono text-sm overflow-hidden text-ellipsis whitespace-nowrap">
                      https://irongym.com/registro?ref={usuario.id}IRON
                    </div>
                    <button 
                      onClick={copiarEnlaceReferido}
                      className="bg-white text-orange-600 hover:bg-orange-50 font-black px-6 py-3 rounded-xl transition flex items-center gap-2 shadow-lg w-full sm:w-auto justify-center"
                    >
                      {linkCopiado ? <><CheckCircle size={20} /> Copiado</> : <><Copy size={20} /> Copiar Enlace</>}
                    </button>
                  </div>
                </div>
              </div>

              {/* Medallas */}
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                  <Trophy className="text-yellow-500" /> Vitrina de Medallas
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {medallas.map(med => (
                    <div key={med.id} className={`bg-zinc-900 border ${med.desbloqueada ? 'border-orange-500/50 shadow-lg shadow-orange-500/10' : 'border-zinc-800 opacity-60'} rounded-2xl p-6 relative overflow-hidden flex flex-col items-center text-center transition-transform hover:scale-105`}>
                      <div className="text-5xl mb-4 bg-zinc-950 w-20 h-20 rounded-full flex items-center justify-center border border-zinc-800 shadow-inner">
                        {med.icono}
                      </div>
                      <h4 className={`font-black uppercase tracking-wider mb-2 ${med.desbloqueada ? 'text-slate-900 dark:text-white' : 'text-zinc-500'}`}>{med.nombre}</h4>
                      <p className="text-xs text-zinc-400 mb-6">{med.descripcion}</p>
                      
                      <div className="w-full mt-auto">
                        <div className="flex justify-between text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-widest">
                          <span>Progreso</span>
                          <span className={med.desbloqueada ? 'text-orange-500' : ''}>{med.progreso}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                          <div 
                            className={`h-full rounded-full ${med.desbloqueada ? 'bg-gradient-to-r from-orange-600 to-yellow-500' : 'bg-zinc-700'}`}
                            style={{ width: `${med.progreso}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      {med.desbloqueada && (
                        <div className="absolute top-3 right-3 text-yellow-500">
                          <CheckCircle size={16} fill="currentColor" className="text-zinc-900" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {vistaActiva === 'progreso' && (
            <div className="space-y-8 animate-fade-in">
              <header>
                <h1 className="text-3xl font-black uppercase tracking-tighter">
                  Tu <span className="text-orange-500">Evolución</span>
                </h1>
                <p className="text-zinc-400">Datos reales obtenidos desde el servidor.</p>
              </header>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 p-6 rounded-3xl shadow-xl">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">📈 Carga Máxima (kg)</h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={progresoData}>
                        <defs>
                          <linearGradient id="colorPeso" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis dataKey="fecha" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', color: '#fff' }} />
                        <Area type="monotone" dataKey="peso" stroke="#f97316" strokeWidth={4} fillOpacity={1} fill="url(#colorPeso)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-orange-600 to-orange-500 p-8 rounded-3xl shadow-lg shadow-orange-500/20">
                    <p className="text-orange-100 text-xs font-bold uppercase tracking-widest">Récord Personal</p>
                    <h4 className="text-5xl font-black mt-2 text-slate-900 dark:text-white">100<span className="text-xl ml-1 text-orange-200">kg</span></h4>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl">
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Volumen Semanal</p>
                    <h4 className="text-4xl font-black text-slate-900 dark:text-white mt-2">1,240<span className="text-xl ml-1 text-zinc-500">kg</span></h4>
                    <p className="text-green-500 text-xs mt-3 font-bold bg-green-500/10 inline-block px-2 py-1 rounded">↑ 12% vs semana pasada</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {vistaActiva === 'clases' && (
            <div className="space-y-8 animate-fade-in">
              <header>
                <h1 className="text-3xl font-black uppercase tracking-tighter">
                  Próximas <span className="text-orange-500">Clases</span>
                </h1>
                <p className="text-zinc-400">Reserva tu espacio, lugares limitados.</p>
              </header>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {clases.map((clase) => (
                  <div key={clase.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl hover:border-orange-500/50 transition-all group relative overflow-hidden">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase mb-4">{clase.nombre}</h3>
                    <div className="space-y-2 mb-6 text-sm text-zinc-400">
                      <p className="flex items-center gap-2"><Calendar size={16} className="text-orange-500"/> {new Date(clase.fecha_inicio).toLocaleString()}</p>
                      <p className="flex items-center gap-2"><Users size={16} className="text-blue-500"/> Inscritos: <span className="text-slate-900 dark:text-white font-bold">{clase.reservas_count} / {clase.aforo_maximo}</span></p>
                    </div>
                    <button
                      onClick={() => handleReservar(clase.id)}
                      disabled={!usuario.membresia_activa || clase.reservas_count >= clase.aforo_maximo}
                      className={`w-full py-4 rounded-xl font-black uppercase transition-all flex justify-center items-center gap-2 ${
                        !usuario.membresia_activa 
                          ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' 
                          : clase.reservas_count >= clase.aforo_maximo 
                            ? 'bg-red-500/20 text-red-500 border border-red-500/50 cursor-not-allowed' 
                            : 'bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/20 text-white'
                      }`}
                    >
                      {!usuario.membresia_activa 
                        ? 'Requiere Renovar' 
                        : clase.reservas_count >= clase.aforo_maximo 
                          ? 'Clase Llena' 
                          : 'Reservar Lugar'}
                    </button>
                  </div>
                ))}
                {clases.length === 0 && (
                  <div className="col-span-full py-20 text-center border border-dashed border-zinc-800 rounded-3xl text-zinc-600 font-medium">
                    No hay clases programadas.
                  </div>
                )}
              </div>
            </div>
          )}

          {vistaActiva === 'rutinas' && (
            <div className="space-y-8 animate-fade-in">
              <div className="flex justify-between items-center">
                <h1 className="text-3xl font-black tracking-tighter uppercase">
                  Plan de <span className="text-orange-500">Entrenamiento</span>
                </h1>
                <button
                  onClick={() => setIsCrearRutinaOpen(true)}
                  className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-3 rounded-xl font-bold transition shadow-lg shadow-orange-500/20 text-sm"
                >
                  <Plus size={18} /> Crear Rutina
                </button>
              </div>

              {rutinas.map((rutina) => (
                <div key={rutina.id} className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden shadow-xl animate-fade-in">
                  <div className="p-6 border-b border-zinc-800/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="text-xl font-black text-orange-500 uppercase flex items-center gap-2">
                        {rutina.nombre}
                        {rutina.entrenador_id === null && (
                          <span className="text-[10px] bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full font-bold uppercase">Personal</span>
                        )}
                      </h3>
                      {rutina.descripcion && <p className="text-xs text-zinc-400 mt-1">{rutina.descripcion}</p>}
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <button 
                        onClick={() => descargarRutinaPDF(rutina)}
                        className="flex-1 sm:flex-initial flex items-center gap-2 bg-white dark:bg-zinc-800 hover:bg-zinc-700 text-slate-900 dark:text-white px-4 py-2 rounded-lg font-bold transition-colors border border-zinc-700 hover:border-orange-500/50 text-sm shadow-lg justify-center"
                      >
                        <Download size={16} /> Descargar PDF
                      </button>
                      {rutina.entrenador_id === null && (
                        <button 
                          onClick={() => handleEliminarRutina(rutina.id)}
                          className="flex items-center justify-center p-2 rounded-lg bg-red-950/40 border border-red-900/50 hover:bg-red-900 text-red-400 transition"
                          title="Eliminar Rutina"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    {rutina.ejercicios?.map((ej, idx) => {
                      const key = `${rutina.id}_${idx}`;
                      return (
                        <div key={idx} className="bg-zinc-950 p-5 rounded-2xl flex flex-col lg:flex-row justify-between items-center gap-6 border border-zinc-800/50">
                          <div className="flex-1 w-full">
                            <div className="flex items-center flex-wrap gap-2 mb-1">
                              <p className="font-bold text-lg text-slate-900 dark:text-white">{ej.nombre_ejercicio}</p>
                              {ej.multimedia && (
                                <button
                                  onClick={() => setActiveMediaUrl(ej.multimedia)}
                                  className="inline-flex items-center gap-1 text-[10px] text-orange-400 bg-orange-950/40 border border-orange-900/50 hover:bg-orange-500 hover:text-white px-2 py-0.5 rounded-full transition-all font-black uppercase"
                                >
                                  <Film size={10} /> Guía
                                </button>
                              )}
                            </div>
                            <div className="flex gap-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">
                              <span>{ej.series} Series</span>
                              <span className="text-zinc-700">•</span>
                              <span>{ej.repeticiones} Reps</span>
                              {ej.peso_sugerido && (
                                <>
                                  <span className="text-zinc-700">•</span>
                                  <span className="text-orange-500/80">Sug: {ej.peso_sugerido}kg</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 w-full lg:w-auto">
                            <input 
                              type="number" 
                              placeholder="Kg" 
                              value={registroInputs[key]?.peso || ''}
                              onChange={(e) => setRegistroInputs(prev => ({
                                ...prev,
                                [key]: { ...prev[key], peso: e.target.value }
                              }))}
                              className="w-20 bg-white dark:bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-center text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none text-slate-900 dark:text-white font-bold" 
                            />
                            <input 
                              type="number" 
                              placeholder="Reps" 
                              value={registroInputs[key]?.reps || ''}
                              onChange={(e) => setRegistroInputs(prev => ({
                                ...prev,
                                [key]: { ...prev[key], reps: e.target.value }
                              }))}
                              className="w-20 bg-white dark:bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-center text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none text-slate-900 dark:text-white font-bold" 
                            />
                            <button 
                              onClick={() => handleRegistrarProgresoReal(ej.nombre_ejercicio, key, ej.series)} 
                              className="bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-xl transition shadow-lg shadow-orange-500/20"
                            >
                              <CheckCircle size={20} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {(!rutina.ejercicios || rutina.ejercicios.length === 0) && (
                      <p className="text-zinc-500 font-medium">No hay ejercicios asignados.</p>
                    )}
                  </div>
                </div>
              ))}
              {rutinas.length === 0 && (
                <div className="col-span-full py-20 text-center border border-dashed border-zinc-800 rounded-3xl text-zinc-600 font-medium">
                  Aún no tienes rutinas asignadas. ¡Crea una nueva arriba!
                </div>
              )}
            </div>
          )}

          {vistaActiva === 'historial_rutinas' && (
            <div className="space-y-8 animate-fade-in text-left">
              <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-3xl font-black uppercase tracking-tighter">
                    Historial de <span className="text-orange-500">Ejercicios</span>
                  </h1>
                  <p className="text-zinc-400">Controla y edita tus marcas personales para ver cómo progresas.</p>
                </div>
                <button
                  onClick={() => setIsManualLogOpen(true)}
                  className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-3 rounded-xl font-bold transition shadow-lg shadow-orange-500/20 text-sm w-full sm:w-auto justify-center"
                >
                  <Plus size={18} /> Registrar Peso Manual
                </button>
              </header>

              {historialEjercicios.length > 0 ? (
                (() => {
                  const ejerciciosUnicos = Array.from(new Set(historialEjercicios.map(h => h.ejercicio_nombre)));
                  const activeEx = selectedExercise || ejerciciosUnicos[0] || '';
                  const logsEx = historialEjercicios
                    .filter(h => h.ejercicio_nombre === activeEx)
                    .slice()
                    .reverse(); // chronological order
                  
                  const maxPeso = logsEx.length > 0 ? Math.max(...logsEx.map(l => l.peso)) : 0;
                  const ultimoPeso = logsEx.length > 0 ? logsEx[logsEx.length - 1].peso : 0;
                  const primerPeso = logsEx.length > 0 ? logsEx[0].peso : 0;
                  const haSubido = ultimoPeso > primerPeso;
                  const diferencia = ultimoPeso - primerPeso;

                  return (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 p-6 rounded-3xl shadow-xl">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              📈 Evolución en:
                            </h3>
                            <select
                              value={activeEx}
                              onChange={(e) => setSelectedExercise(e.target.value)}
                              className="bg-zinc-950 border border-zinc-800 text-slate-900 dark:text-white rounded-xl px-4 py-2 font-bold focus:border-orange-500 outline-none text-sm"
                            >
                              {ejerciciosUnicos.map((ex, i) => (
                                <option key={i} value={ex}>{ex}</option>
                              ))}
                            </select>
                          </div>
                          
                          {logsEx.length > 0 ? (
                            <div className="h-[300px] w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={logsEx.map(l => ({ fecha: new Date(l.fecha).toLocaleDateString(), peso: l.peso }))} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                  <defs>
                                    <linearGradient id="colorPesoEx" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                  <XAxis dataKey="fecha" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickMargin={10} />
                                  <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickMargin={10} />
                                  <Tooltip 
                                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', color: '#fff', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
                                    itemStyle={{ color: '#f97316', fontWeight: 'bold' }}
                                    cursor={{ stroke: '#f97316', strokeWidth: 1, strokeDasharray: '3 3' }}
                                  />
                                  <Area 
                                    type="monotone" 
                                    dataKey="peso" 
                                    stroke="#f97316" 
                                    strokeWidth={4} 
                                    fillOpacity={1} 
                                    fill="url(#colorPesoEx)" 
                                    activeDot={{ r: 8, stroke: '#fff', strokeWidth: 2, fill: '#f97316' }}
                                    dot={{ r: 4, stroke: '#f97316', strokeWidth: 2, fill: '#18181b' }}
                                    animationDuration={1500}
                                  />
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>
                          ) : (
                            <p className="text-zinc-500 text-center py-20">Selecciona un ejercicio para ver su evolución.</p>
                          )}
                        </div>

                        <div className="space-y-6">
                          <div className="bg-gradient-to-br from-orange-600 to-orange-500 p-8 rounded-3xl shadow-lg shadow-orange-500/20">
                            <p className="text-orange-100 text-xs font-bold uppercase tracking-widest">Récord Personal (PR)</p>
                            <h4 className="text-5xl font-black mt-2 text-slate-900 dark:text-white">{maxPeso}<span className="text-xl ml-1 text-orange-200">kg</span></h4>
                            <p className="text-xs text-orange-100/80 mt-2 font-medium">Carga máxima registrada para {activeEx}</p>
                          </div>
                          
                          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl">
                            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Progresión del Peso</p>
                            <h4 className="text-4xl font-black text-slate-900 dark:text-white mt-2">
                              {ultimoPeso}<span className="text-xl ml-1 text-zinc-500">kg</span>
                            </h4>
                            {logsEx.length > 1 && (
                              <p className={`text-xs mt-3 font-bold px-2 py-1 rounded inline-block ${haSubido ? 'bg-green-500/10 text-green-500' : 'bg-zinc-500/10 text-zinc-400'}`}>
                                {haSubido ? `↑ Subiste +${diferencia}kg` : `Diferencia de ${diferencia}kg`} vs marca inicial
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Tabla de registros */}
                      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
                        <div className="p-6 border-b border-zinc-800">
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white">📋 Registros Recientes</h3>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm text-zinc-400">
                            <thead className="bg-zinc-950 text-xs font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-800">
                              <tr>
                                <th className="px-6 py-4">Fecha</th>
                                <th className="px-6 py-4">Ejercicio</th>
                                <th className="px-6 py-4">Peso</th>
                                <th className="px-6 py-4">Series</th>
                                <th className="px-6 py-4">Repeticiones</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/50">
                              {historialEjercicios.map((log) => (
                                <tr key={log.id} className="hover:bg-white dark:bg-zinc-800/20 transition-colors">
                                  <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{new Date(log.fecha).toLocaleDateString()}</td>
                                  <td className="px-6 py-4 font-bold text-orange-500">{log.ejercicio_nombre}</td>
                                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{log.peso} kg</td>
                                  <td className="px-6 py-4">{log.series}</td>
                                  <td className="px-6 py-4">{log.repeticiones}</td>
                                  <td className="px-6 py-4 text-right space-x-2">
                                    <button
                                      onClick={() => openEditarHistorial(log)}
                                      className="p-2 rounded bg-white dark:bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-slate-900 dark:text-white transition"
                                      title="Editar marcas"
                                    >
                                      <Edit2 size={14} />
                                    </button>
                                    <button
                                      onClick={() => handleEliminarRegistroHistorial(log.id)}
                                      className="p-2 rounded bg-red-950/40 border border-red-900/50 hover:bg-red-900 text-red-400 transition"
                                      title="Eliminar marca"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="py-20 text-center border border-dashed border-zinc-800 rounded-3xl text-zinc-500 space-y-4">
                  <p className="font-semibold text-lg">Aún no has registrado ningún levantamiento.</p>
                  <p className="text-sm text-zinc-600 max-w-md mx-auto">
                    Ve a "Mis Rutinas" e introduce tus pesos y repeticiones al completar un ejercicio, o haz clic en "Registrar Peso Manual" arriba.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ===== MODAL DE PASARELA DE PAGO (BIZUM / STRIPE) ===== */}
      {isPagoOpen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative text-slate-900 dark:text-white">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-600 to-orange-500 p-6 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                  <CreditCard /> Renovar Membresía
                </h2>
                <p className="text-orange-100 text-xs mt-1">Elige tu plan y método de pago preferido</p>
              </div>
              <button onClick={() => setIsPagoOpen(false)} className="text-slate-900 dark:text-white/80 hover:text-slate-900 dark:text-white transition">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={procesarPago} className="p-6 space-y-6">
              
              {/* Planes */}
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 block">1. Selecciona tu Plan</label>
                <div className="grid grid-cols-3 gap-3">
                  <div 
                    type="button"
                    onClick={() => setPlanSeleccionado('mensual')}
                    className={`cursor-pointer p-4 rounded-xl border text-center transition-all ${
                      planSeleccionado === 'mensual' 
                        ? 'bg-orange-500/10 border-orange-500 text-white' 
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <p className="text-xs uppercase font-bold text-zinc-500">Mensual</p>
                    <p className="text-lg font-black mt-1">29€</p>
                    <p className="text-[10px] text-zinc-500">Al mes</p>
                  </div>
                  <div 
                    type="button"
                    onClick={() => setPlanSeleccionado('trimestral')}
                    className={`cursor-pointer p-4 rounded-xl border text-center transition-all relative ${
                      planSeleccionado === 'trimestral' 
                        ? 'bg-orange-500/10 border-orange-500 text-white' 
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <span className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-orange-600 text-slate-900 dark:text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">-10%</span>
                    <p className="text-xs uppercase font-bold text-zinc-500">3 Meses</p>
                    <p className="text-lg font-black mt-1">79€</p>
                    <p className="text-[10px] text-zinc-500">Pago único</p>
                  </div>
                  <div 
                    type="button"
                    onClick={() => setPlanSeleccionado('anual')}
                    className={`cursor-pointer p-4 rounded-xl border text-center transition-all relative ${
                      planSeleccionado === 'anual' 
                        ? 'bg-orange-500/10 border-orange-500 text-white' 
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <span className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-green-600 text-slate-900 dark:text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">Ahorro</span>
                    <p className="text-xs uppercase font-bold text-zinc-500">Anual</p>
                    <p className="text-lg font-black mt-1">299€</p>
                    <p className="text-[10px] text-zinc-500">Todo el año</p>
                  </div>
                </div>
              </div>

              {/* Metodo de Pago */}
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 block">2. Método de Pago</label>
                <div className="grid grid-cols-2 gap-4">
                  <div 
                    type="button"
                    onClick={() => setMetodoPago('stripe')}
                    className={`cursor-pointer p-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                      metodoPago === 'stripe' 
                        ? 'bg-orange-500/10 border-orange-500 text-white' 
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <CreditCard size={18} className={metodoPago === 'stripe' ? 'text-orange-500' : ''} />
                    <span className="font-bold text-sm">Tarjeta (Stripe)</span>
                  </div>
                  <div 
                    type="button"
                    onClick={() => setMetodoPago('bizum')}
                    className={`cursor-pointer p-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                      metodoPago === 'bizum' 
                        ? 'bg-[#00a29a]/10 border-[#00a29a] text-slate-900 dark:text-white' 
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-[#00a29a] flex items-center justify-center font-bold text-[10px] text-slate-900 dark:text-white">B</span>
                    <span className="font-bold text-sm">Bizum</span>
                  </div>
                </div>
              </div>

              {/* Formulario segun el Metodo */}
              {metodoPago === 'stripe' ? (
                <div className="space-y-3 bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2 text-left">Pasarela Segura SSL</p>
                  <div>
                    <input 
                      type="text" 
                      required 
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-orange-500 outline-none" 
                      placeholder="Número de Tarjeta (XXXX XXXX XXXX XXXX)"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input 
                      type="text" 
                      required 
                      className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-center text-slate-900 dark:text-white focus:border-orange-500 outline-none" 
                      placeholder="MM / AA"
                    />
                    <input 
                      type="password" 
                      maxLength="3" 
                      required 
                      className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-center text-slate-900 dark:text-white focus:border-orange-500 outline-none" 
                      placeholder="CVC"
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-[#00a29a]/5 border border-[#00a29a]/20 p-5 rounded-2xl space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-[#00a29a] flex items-center justify-center font-black text-xs text-slate-900 dark:text-white">B</span>
                    <div className="text-left">
                      <h4 className="font-bold text-[#00a29a] text-sm uppercase">Pago Instantáneo por Bizum</h4>
                      <p className="text-xs text-zinc-400 mt-0.5">Sigue estos sencillos pasos:</p>
                    </div>
                  </div>
                  <div className="text-xs text-zinc-300 space-y-3 border-t border-zinc-800 pt-3 text-left">
                    <p>1. Envía el Bizum al número: <strong className="text-slate-900 dark:text-white text-sm bg-zinc-950 px-2 py-1 rounded border border-zinc-800 tracking-wider">+34 640 23 65</strong></p>
                    <p>2. Escribe tu email (<strong className="text-[#00a29a]">{usuario.email}</strong>) como concepto del Bizum.</p>
                    <p>3. Haz clic abajo en el botón "Confirmar Pago Bizum".</p>
                  </div>
                </div>
              )}

              {/* Boton de envio */}
              <button 
                type="submit" 
                disabled={pagoLoading}
                className={`w-full py-4 rounded-xl uppercase font-black tracking-widest text-sm transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 ${
                  metodoPago === 'bizum' 
                    ? 'bg-[#00a29a] hover:bg-[#008f88] text-slate-900 dark:text-white shadow-[#00a29a]/20' 
                    : 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20'
                }`}
              >
                {pagoLoading ? 'Procesando Transacción...' : metodoPago === 'bizum' ? 'Confirmar Pago Bizum' : 'Realizar Pago Seguro'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL DE CREACIÓN DE RUTINA ===== */}
      {isCrearRutinaOpen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl my-8 overflow-hidden shadow-2xl relative text-slate-900 dark:text-white flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-600 to-orange-500 p-6 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                  <Activity /> Crear Nueva Rutina
                </h2>
                <p className="text-orange-100 text-xs mt-1">Diseña tu propio entrenamiento a medida</p>
              </div>
              <button onClick={() => setIsCrearRutinaOpen(false)} className="text-slate-900 dark:text-white/80 hover:text-slate-900 dark:text-white transition">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCrearRutina} className="p-6 space-y-6 overflow-y-auto flex-1 text-left">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5 block">Nombre de la Rutina *</label>
                  <input
                    type="text"
                    required
                    value={nuevaRutinaNombre}
                    onChange={(e) => setNuevaRutinaNombre(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-orange-500 outline-none"
                    placeholder="Ej. Pecho y Tríceps Avanzado"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5 block">Descripción (Opcional)</label>
                  <textarea
                    value={nuevaRutinaDescripcion}
                    onChange={(e) => setNuevaRutinaDescripcion(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-orange-500 outline-none h-20 resize-none"
                    placeholder="Ej. Enfoque en hipertrofia y progresión de cargas."
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Ejercicios de la Rutina</label>
                  <button
                    type="button"
                    onClick={() => setNuevaRutinaEjercicios(prev => [...prev, { nombre_ejercicio: '', series: 4, repeticiones: '10', peso_sugerido: 0, descanso_segundos: 90, multimedia: '' }])}
                    className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-400 transition font-bold"
                  >
                    <Plus size={14} /> Añadir Ejercicio
                  </button>
                </div>

                <div className="space-y-4">
                  {nuevaRutinaEjercicios.map((ej, index) => (
                    <div key={index} className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl relative space-y-3">
                      {nuevaRutinaEjercicios.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setNuevaRutinaEjercicios(prev => prev.filter((_, i) => i !== index))}
                          className="absolute top-3 right-3 text-zinc-500 hover:text-red-500 transition"
                        >
                          <X size={18} />
                        </button>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 block">Nombre Ejercicio *</label>
                          <input
                            type="text"
                            required
                            value={ej.nombre_ejercicio}
                            onChange={(e) => {
                              const list = [...nuevaRutinaEjercicios];
                              list[index].nombre_ejercicio = e.target.value;
                              setNuevaRutinaEjercicios(list);
                            }}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-orange-500 outline-none font-bold"
                            placeholder="Ej. Press de Banca"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 block">Guía Multimedia / URL (Opcional)</label>
                          <input
                            type="text"
                            value={ej.multimedia}
                            onChange={(e) => {
                              const list = [...nuevaRutinaEjercicios];
                              list[index].multimedia = e.target.value;
                              setNuevaRutinaEjercicios(list);
                            }}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-orange-500 outline-none"
                            placeholder="Ej. URL de imagen o vídeo"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1 block">Series</label>
                          <input
                            type="number"
                            min="1"
                            value={ej.series}
                            onChange={(e) => {
                              const list = [...nuevaRutinaEjercicios];
                              list[index].series = e.target.value;
                              setNuevaRutinaEjercicios(list);
                            }}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2 text-center text-xs text-slate-900 dark:text-white focus:border-orange-500 outline-none font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1 block">Reps</label>
                          <input
                            type="text"
                            value={ej.repeticiones}
                            onChange={(e) => {
                              const list = [...nuevaRutinaEjercicios];
                              list[index].repeticiones = e.target.value;
                              setNuevaRutinaEjercicios(list);
                            }}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2 text-center text-xs text-slate-900 dark:text-white focus:border-orange-500 outline-none font-bold"
                            placeholder="10"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1 block">Sugerido (kg)</label>
                          <input
                            type="number"
                            value={ej.peso_sugerido}
                            onChange={(e) => {
                              const list = [...nuevaRutinaEjercicios];
                              list[index].peso_sugerido = e.target.value;
                              setNuevaRutinaEjercicios(list);
                            }}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2 text-center text-xs text-slate-900 dark:text-white focus:border-orange-500 outline-none font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1 block">Descanso (s)</label>
                          <input
                            type="number"
                            value={ej.descanso_segundos}
                            onChange={(e) => {
                              const list = [...nuevaRutinaEjercicios];
                              list[index].descanso_segundos = e.target.value;
                              setNuevaRutinaEjercicios(list);
                            }}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2 text-center text-xs text-slate-900 dark:text-white focus:border-orange-500 outline-none font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl transition shadow-lg shadow-orange-500/20 uppercase tracking-widest text-sm shrink-0"
              >
                Crear Rutina
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL DE EDICIÓN DE HISTORIAL ===== */}
      {isEditHistoryOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative text-slate-900 dark:text-white">
            <div className="bg-gradient-to-r from-orange-600 to-orange-500 p-6 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                  <Edit2 size={20} /> Modificar Marca
                </h2>
                <p className="text-orange-100 text-xs mt-1">Modifica el peso y repeticiones registradas</p>
              </div>
              <button onClick={() => setIsEditHistoryOpen(false)} className="text-slate-900 dark:text-white/80 hover:text-slate-900 dark:text-white transition">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSaveEditHistory} className="p-6 space-y-4 text-left">
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5 block">Nombre del Ejercicio</label>
                <input
                  type="text"
                  required
                  value={editExerciseName}
                  onChange={(e) => setEditExerciseName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-orange-500 outline-none font-bold"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5 block text-center">Peso (kg)</label>
                  <input
                    type="number"
                    required
                    value={editWeight}
                    onChange={(e) => setEditWeight(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-center text-sm text-slate-900 dark:text-white focus:border-orange-500 outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5 block text-center">Series</label>
                  <input
                    type="number"
                    required
                    value={editSeries}
                    onChange={(e) => setEditSeries(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-center text-sm text-slate-900 dark:text-white focus:border-orange-500 outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5 block text-center">Reps</label>
                  <input
                    type="text"
                    required
                    value={editReps}
                    onChange={(e) => setEditReps(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-center text-sm text-slate-900 dark:text-white focus:border-orange-500 outline-none font-bold"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-orange-500/20 uppercase tracking-wider text-xs"
              >
                Guardar Cambios
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL DE REGISTRO MANUAL DE HISTORIAL ===== */}
      {isManualLogOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative text-slate-900 dark:text-white">
            <div className="bg-gradient-to-r from-orange-600 to-orange-500 p-6 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                  <Plus size={20} /> Registrar Serie Manual
                </h2>
                <p className="text-orange-100 text-xs mt-1">Añade marcas de entrenamiento al historial</p>
              </div>
              <button onClick={() => setIsManualLogOpen(false)} className="text-slate-900 dark:text-white/80 hover:text-slate-900 dark:text-white transition">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleManualLog} className="p-6 space-y-4 text-left">
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5 block">Nombre del Ejercicio *</label>
                <input
                  type="text"
                  required
                  value={manualExerciseName}
                  onChange={(e) => setManualExerciseName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-orange-500 outline-none font-bold"
                  placeholder="Ej. Sentadilla con Barra"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5 block text-center">Peso (kg) *</label>
                  <input
                    type="number"
                    required
                    value={manualWeight}
                    onChange={(e) => setManualWeight(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-center text-sm text-slate-900 dark:text-white focus:border-orange-500 outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5 block text-center">Series</label>
                  <input
                    type="number"
                    required
                    value={manualSeries}
                    onChange={(e) => setManualSeries(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-center text-sm text-slate-900 dark:text-white focus:border-orange-500 outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5 block text-center">Reps</label>
                  <input
                    type="text"
                    required
                    value={manualReps}
                    onChange={(e) => setManualReps(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-center text-sm text-slate-900 dark:text-white focus:border-orange-500 outline-none font-bold"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-orange-500/20 uppercase tracking-wider text-xs"
              >
                Registrar Entrenamiento
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ===== LIGHTBOX MULTIMEDIA DE EJERCICIOS ===== */}
      {activeMediaUrl && (
        <div className="fixed inset-0 bg-black/98 flex flex-col items-center justify-center z-50 p-4 animate-fade-in">
          <button 
            onClick={() => setActiveMediaUrl(null)} 
            className="absolute top-6 right-6 text-slate-900 dark:text-white/70 hover:text-slate-900 dark:text-white bg-zinc-900 border border-zinc-800 p-3 rounded-full transition shadow-lg"
          >
            <X size={24} />
          </button>
          
          <div className="max-w-4xl max-h-[80vh] flex items-center justify-center p-4">
            {activeMediaUrl.startsWith('data:image/') || activeMediaUrl.match(/\.(jpeg|jpg|gif|png|webp)/i) ? (
              <img 
                src={activeMediaUrl} 
                alt="Guía Ejercicio" 
                className="max-h-[75vh] max-w-full rounded-2xl border border-zinc-800 shadow-2xl object-contain animate-scale-up" 
              />
            ) : activeMediaUrl.startsWith('data:video/') || activeMediaUrl.match(/\.(mp4|webm|ogg)/i) ? (
              <video 
                src={activeMediaUrl} 
                controls 
                autoPlay 
                loop 
                className="max-h-[75vh] max-w-full rounded-2xl border border-zinc-800 shadow-2xl object-contain animate-scale-up" 
              />
            ) : (
              <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl max-w-md text-center space-y-6 shadow-2xl animate-scale-up">
                <div className="w-16 h-16 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center mx-auto border border-orange-500/20">
                  <Link size={32} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-wider">Demostración Externa</h3>
                  <p className="text-xs text-zinc-400">Este ejercicio contiene un enlace a un recurso externo o guía explicativa.</p>
                </div>
                <a 
                  href={activeMediaUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-block w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl transition shadow-lg shadow-orange-500/20 text-sm"
                >
                  Abrir Guía de Ejercicio ↗
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

