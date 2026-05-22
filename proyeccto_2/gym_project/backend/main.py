import bcrypt
# Mock bcrypt.__about__ for passlib compatibility in Python 3.12+
if not hasattr(bcrypt, "__about__"):
    class MockAbout:
        __version__ = getattr(bcrypt, "__version__", "4.0.1")
    bcrypt.__about__ = MockAbout()

from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func
from datetime import datetime, date, timedelta
from passlib.context import CryptContext
import jwt
from pydantic import BaseModel
import os
from dotenv import load_dotenv

load_dotenv()

# Importaciones de tu proyecto
from database import SessionLocal, engine
import models
import schemas
from schemas.usuario import AdminClienteCreate
from core import email_service

# Crear las tablas en la BD
models.base.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Iron Gym API", version="2.0")

import traceback

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "message": "Internal Server Error",
            "error_type": type(exc).__name__,
            "error_detail": str(exc),
            "traceback": traceback.format_exc()
        }
    )

import api.progreso
app.include_router(api.progreso.router, prefix="/api/progreso", tags=["progreso"])

# Configuración CORS
CORS_ORIGINS = [
    "http://localhost:5173", 
    "http://127.0.0.1:5173", 
    "http://localhost:8000", 
    "http://127.0.0.1:8000",
    "http://localhost:8001",
    "http://127.0.0.1:8001"
]
PROD_ORIGIN = os.getenv("PROD_ORIGIN")
if PROD_ORIGIN:
    CORS_ORIGINS.append(PROD_ORIGIN)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuración de Seguridad
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("SECRET_KEY", "iron_gym_super_secret_key")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

# Dependencia de Base de Datos
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def verificar_usuario_activo(usuario: models.Usuario):
    if usuario.estado != models.EstadoUsuario.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Acceso denegado. Tu cuenta está: {usuario.estado}. Motivo: {usuario.motivo_suspension}"
        )
    return usuario

# ==========================================
# 0. REGISTRO DINÁMICO
# ==========================================
@app.post("/api/usuarios", response_model=schemas.UsuarioOut, status_code=status.HTTP_201_CREATED)
def crear_usuario(usuario: schemas.UsuarioCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    db_user = db.query(models.Usuario).filter(models.Usuario.email == usuario.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="El email ya está registrado.")

    hashed_pwd = pwd_context.hash(usuario.password)
    nuevo_usuario = models.Usuario(
        nombre=usuario.nombre, email=usuario.email, telefono=usuario.telefono,
        rol=usuario.rol, hashed_password=hashed_pwd, estado=models.EstadoUsuario.activo
    )
    db.add(nuevo_usuario)
    db.flush()

    if usuario.rol == models.RolUsuario.entrenador:
        nuevo_monitor = models.Monitor(usuario_id=nuevo_usuario.id, especialidad="General", esta_activo=True)
        db.add(nuevo_monitor)
        email_service.notificar_bienvenida_entrenador(background_tasks=background_tasks, email_usuario=nuevo_usuario.email, nombre_usuario=nuevo_usuario.nombre)

    db.commit()
    db.refresh(nuevo_usuario)

    if usuario.rol == models.RolUsuario.cliente:
        email_service.notificar_bienvenida_cliente(
            background_tasks=background_tasks, email_usuario=nuevo_usuario.email, nombre_usuario=nuevo_usuario.nombre
        )
    return nuevo_usuario

# ==========================================
# 0b. ALTA RÁPIDA DE CLIENTE DESDE ADMIN
# ==========================================
@app.post("/api/admin/clientes", response_model=schemas.UsuarioOut, status_code=status.HTTP_201_CREATED)
def alta_rapida_cliente(datos: AdminClienteCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Permite al admin dar de alta un cliente solo con email y password (+ foto opcional)."""
    db_user = db.query(models.Usuario).filter(models.Usuario.email == datos.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="El email ya está registrado.")

    # Si no se proporciona nombre, usar la parte del email antes del @
    nombre_final = datos.nombre if datos.nombre else datos.email.split('@')[0].capitalize()

    hashed_pwd = pwd_context.hash(datos.password)
    nuevo_cliente = models.Usuario(
        nombre=nombre_final,
        email=datos.email,
        telefono=datos.telefono,
        hashed_password=hashed_pwd,
        rol=models.RolUsuario.cliente,
        estado=models.EstadoUsuario.activo,
        membresia_activa=True,
        foto_perfil=datos.foto_perfil
    )
    db.add(nuevo_cliente)
    db.commit()
    db.refresh(nuevo_cliente)

    # Notificar al cliente por email con sus credenciales
    email_service.notificar_alta_cliente_admin(
        background_tasks=background_tasks,
        email_usuario=nuevo_cliente.email,
        nombre_usuario=nuevo_cliente.nombre,
        password_temporal=datos.password
    )
    return nuevo_cliente

# ==========================================
# 1. LOGIN CON TOKEN JWT
# ==========================================
class LoginRequest(BaseModel):
    email: str
    password: str

@app.post("/api/login")
def iniciar_sesion(credenciales: LoginRequest, db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(models.Usuario.email == credenciales.email).first()
    
    if not usuario or not pwd_context.verify(credenciales.password, usuario.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Correo o contraseña incorrectos")
    
    verificar_usuario_activo(usuario)

    payload = {
        "sub": usuario.email,
        "id": usuario.id,
        "rol": usuario.rol.value,
        "exp": datetime.utcnow() + timedelta(days=7)
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    return {
        "access_token": token,
        "token_type": "bearer",
        "usuario": {
            "id": usuario.id,
            "nombre": usuario.nombre,
            "rol": usuario.rol.value
        }
    }

# ==========================================
# 2. GESTIÓN AVANZADA: ESTADOS
# ==========================================
@app.put("/api/usuarios/{usuario_id}/estado", response_model=schemas.UsuarioOut)
def actualizar_estado_cliente(usuario_id: int, datos_update: schemas.UsuarioUpdate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    usuario_db = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    if not usuario_db: raise HTTPException(status_code=404, detail="Usuario no encontrado")

    estado_anterior = usuario_db.estado
    if datos_update.estado: usuario_db.estado = datos_update.estado
    if datos_update.motivo_suspension is not None: usuario_db.motivo_suspension = datos_update.motivo_suspension
    if datos_update.membresia_activa is not None: 
        usuario_db.membresia_activa = datos_update.membresia_activa
        if datos_update.membresia_activa:
            usuario_db.fecha_fin_membresia = datetime.utcnow() + timedelta(days=30)
    if datos_update.foto_perfil is not None: usuario_db.foto_perfil = datos_update.foto_perfil

    db.add(models.Auditoria(usuario_id=1, accion=f"CAMBIO_ESTADO_A_{usuario_db.estado}", tabla_afectada="usuarios", registro_afectado_id=usuario_db.id))
    db.commit()
    db.refresh(usuario_db)
    
    if usuario_db.estado == models.EstadoUsuario.suspendido and estado_anterior != models.EstadoUsuario.suspendido:
        email_service.notificar_suspension_cuenta(background_tasks=background_tasks, email_usuario=usuario_db.email, nombre_usuario=usuario_db.nombre, motivo=usuario_db.motivo_suspension or "Revisión")
    return usuario_db

class FotoUpdate(BaseModel):
    foto_perfil: str  # Base64 data URL

@app.put("/api/usuarios/{usuario_id}/foto", response_model=schemas.UsuarioOut)
def actualizar_foto_usuario(usuario_id: int, datos: FotoUpdate, db: Session = Depends(get_db)):
    """Permite al admin añadir/actualizar la foto de un usuario existente."""
    usuario_db = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    if not usuario_db: raise HTTPException(status_code=404, detail="Usuario no encontrado")
    usuario_db.foto_perfil = datos.foto_perfil
    db.commit()
    db.refresh(usuario_db)
    return usuario_db

# ==========================================
# 3. SISTEMA DE RESERVAS CONSISTENTE
# ==========================================
@app.post("/api/reservas", response_model=schemas.ReservaOut, status_code=status.HTTP_201_CREATED)
def crear_reserva(reserva: schemas.ReservaCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    usuario_db = db.query(models.Usuario).filter(models.Usuario.id == reserva.usuario_id).first()
    if not usuario_db: raise HTTPException(status_code=404, detail="Usuario no encontrado")
    verificar_usuario_activo(usuario_db) 
    
    if not usuario_db.membresia_activa: raise HTTPException(status_code=403, detail="Necesitas una membresía activa para reservar.")
    clase_db = db.query(models.Clase).filter(models.Clase.id == reserva.clase_id).first()
    if not clase_db: raise HTTPException(status_code=404, detail="La clase no existe.")
    
    reservas_actuales = db.query(models.Reserva).filter(models.Reserva.clase_id == clase_db.id, models.Reserva.estado == models.EstadoReserva.confirmada).count()
    if reservas_actuales >= clase_db.aforo_maximo: raise HTTPException(status_code=400, detail="La clase está completa.")

    nueva_reserva = models.Reserva(usuario_id=usuario_db.id, clase_id=clase_db.id, estado=models.EstadoReserva.confirmada)
    db.add(nueva_reserva)

    try:
        db.commit()
        db.refresh(nueva_reserva)
        fecha_formateada = clase_db.fecha_inicio.strftime("%d/%m/%Y a las %H:%M")
        email_service.enviar_correo_reserva_async(background_tasks=background_tasks, email_usuario=usuario_db.email, nombre_usuario=usuario_db.nombre, nombre_clase=clase_db.nombre, fecha_clase=fecha_formateada)
        return nueva_reserva
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Ya tienes una reserva confirmada para esta clase.")

# ==========================================
# 4. CONTROL DE ACCESO QR
# ==========================================
class QRScanRequest(BaseModel):
    usuario_id: int

@app.post("/api/acceso/escanear-qr", status_code=status.HTTP_200_OK)
def validar_acceso_qr(req: QRScanRequest, db: Session = Depends(get_db)):
    usuario_id = req.usuario_id
    usuario_db = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    exito, mensaje_error = True, None

    if not usuario_db: exito, mensaje_error = False, "QR Inválido: Usuario no encontrado."
    elif usuario_db.estado != models.EstadoUsuario.activo: exito, mensaje_error = False, f"Acceso denegado: Cuenta en estado '{usuario_db.estado}'."
    elif not usuario_db.membresia_activa: exito, mensaje_error = False, "Acceso denegado: Membresía inactiva o vencida."

    registro_acceso = models.AsistenciaQR(usuario_id=usuario_id if usuario_db else None, exito=exito, error_msg=mensaje_error)
    db.add(registro_acceso)
    db.commit()

    if not exito: raise HTTPException(status_code=403, detail=mensaje_error)
    return {"mensaje": f"Bienvenido/a {usuario_db.nombre}", "acceso_id": registro_acceso.id, "hora": registro_acceso.fecha_acceso}

@app.get("/api/acceso/logs")
def obtener_logs_acceso(limit: int = 10, db: Session = Depends(get_db)):
    logs = db.query(models.AsistenciaQR).order_by(models.AsistenciaQR.fecha_acceso.desc()).limit(limit).all()
    res = []
    for log in logs:
        usuario_nombre = log.usuario.nombre if log.usuario else "Desconocido"
        res.append({
            "id": log.id,
            "usuario_id": log.usuario_id,
            "usuario_nombre": usuario_nombre,
            "fecha_acceso": log.fecha_acceso,
            "exito": log.exito,
            "error_msg": log.error_msg
        })
    return res

# ==========================================
# 5. OBTENER DATOS (Usuarios, Clases, Rutinas)
# ==========================================
@app.get("/api/usuarios", response_model=list[schemas.UsuarioOut])
def obtener_usuarios(db: Session = Depends(get_db)):
    return db.query(models.Usuario).all()

@app.get("/api/entrenadores", response_model=list[schemas.UsuarioOut])
def obtener_entrenadores(db: Session = Depends(get_db)):
    return db.query(models.Usuario).filter(models.Usuario.rol == models.RolUsuario.entrenador).all()

@app.get("/api/clases", response_model=list[schemas.ClaseOut])
def obtener_clases(db: Session = Depends(get_db)):
    clases = db.query(models.Clase).all()
    # Populamos campos extra para el schema ClaseOut
    for c in clases:
        c.entrenador_nombre = c.entrenador.nombre if c.entrenador else "Sin asignar"
        reservas_confirmadas = [r for r in c.reservas if r.estado == models.EstadoReserva.confirmada]
        c.reservas_count = len(reservas_confirmadas)
        c.clientes_inscritos = [{"id": r.usuario.id, "nombre": r.usuario.nombre} for r in reservas_confirmadas if r.usuario]
    return clases

@app.post("/api/clases", response_model=schemas.ClaseOut)
def crear_clase(clase_data: schemas.ClaseCreate, db: Session = Depends(get_db)):
    nueva_clase = models.Clase(
        nombre=clase_data.nombre,
        descripcion=clase_data.descripcion,
        entrenador_id=clase_data.entrenador_id,
        aforo_maximo=clase_data.aforo_maximo,
        fecha_inicio=clase_data.fecha_inicio,
        fecha_fin=clase_data.fecha_fin
    )
    db.add(nueva_clase)
    db.commit()
    db.refresh(nueva_clase)
    # Popular campos para el retorno
    nueva_clase.entrenador_nombre = nueva_clase.entrenador.nombre if nueva_clase.entrenador else "Sin asignar"
    nueva_clase.reservas_count = 0
    return nueva_clase

@app.delete("/api/clases/{clase_id}")
def eliminar_clase(clase_id: int, db: Session = Depends(get_db)):
    clase = db.query(models.Clase).filter(models.Clase.id == clase_id).first()
    if not clase:
        raise HTTPException(status_code=404, detail="Clase no encontrada")
    db.delete(clase)
    db.commit()
    return {"mensaje": "Clase eliminada correctamente"}

@app.get("/api/rutinas/cliente/{cliente_id}", response_model=list[schemas.RutinaResponse])
def obtener_rutinas_cliente(cliente_id: int, db: Session = Depends(get_db)):
    return db.query(models.Rutina).filter(models.Rutina.cliente_id == cliente_id).all()

@app.post("/api/rutinas", response_model=schemas.RutinaResponse, status_code=status.HTTP_201_CREATED)
def crear_rutina(rutina_data: schemas.RutinaCreate, db: Session = Depends(get_db)):
    cliente = db.query(models.Usuario).filter(models.Usuario.id == rutina_data.cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    if rutina_data.entrenador_id:
        entrenador = db.query(models.Usuario).filter(models.Usuario.id == rutina_data.entrenador_id).first()
        if not entrenador:
            raise HTTPException(status_code=404, detail="Entrenador no encontrado")

    nueva_rutina = models.Rutina(
        cliente_id=rutina_data.cliente_id,
        entrenador_id=rutina_data.entrenador_id,
        nombre=rutina_data.nombre,
        descripcion=rutina_data.descripcion
    )
    db.add(nueva_rutina)
    db.commit()
    db.refresh(nueva_rutina)

    for ej in rutina_data.ejercicios:
        nuevo_ejercicio = models.EjercicioRutina(
            rutina_id=nueva_rutina.id,
            nombre_ejercicio=ej.nombre_ejercicio,
            series=ej.series,
            repeticiones=ej.repeticiones,
            descanso_segundos=ej.descanso_segundos,
            peso_sugerido=ej.peso_sugerido,
            multimedia=ej.multimedia
        )
        db.add(nuevo_ejercicio)
    
    db.commit()
    db.refresh(nueva_rutina)
    return nueva_rutina

@app.delete("/api/rutinas/{rutina_id}")
def eliminar_rutina(rutina_id: int, db: Session = Depends(get_db)):
    rutina = db.query(models.Rutina).filter(models.Rutina.id == rutina_id).first()
    if not rutina:
        raise HTTPException(status_code=404, detail="Rutina no encontrada")
    db.delete(rutina)
    db.commit()
    return {"mensaje": "Rutina eliminada correctamente"}

# ==========================================
# 5b. HISTORIAL DE EJERCICIOS (PESOS Y PROGRESO)
# ==========================================
@app.get("/api/historial-ejercicios/cliente/{cliente_id}", response_model=list[schemas.HistorialEjercicioOut])
def obtener_historial_ejercicios(cliente_id: int, db: Session = Depends(get_db)):
    return db.query(models.HistorialEjercicio).filter(models.HistorialEjercicio.cliente_id == cliente_id).order_by(models.HistorialEjercicio.fecha.desc()).all()

@app.post("/api/historial-ejercicios", response_model=schemas.HistorialEjercicioOut, status_code=status.HTTP_201_CREATED)
def crear_registro_historial(datos: schemas.HistorialEjercicioCreate, db: Session = Depends(get_db)):
    cliente = db.query(models.Usuario).filter(models.Usuario.id == datos.cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    nuevo_registro = models.HistorialEjercicio(
        cliente_id=datos.cliente_id,
        ejercicio_nombre=datos.ejercicio_nombre,
        peso=datos.peso,
        series=datos.series,
        repeticiones=datos.repeticiones
    )
    db.add(nuevo_registro)
    db.commit()
    db.refresh(nuevo_registro)
    return nuevo_registro

@app.put("/api/historial-ejercicios/{log_id}", response_model=schemas.HistorialEjercicioOut)
def actualizar_registro_historial(log_id: int, datos: schemas.HistorialEjercicioBase, db: Session = Depends(get_db)):
    registro = db.query(models.HistorialEjercicio).filter(models.HistorialEjercicio.id == log_id).first()
    if not registro:
        raise HTTPException(status_code=404, detail="Registro de historial no encontrado")
    
    registro.ejercicio_nombre = datos.ejercicio_nombre
    registro.peso = datos.peso
    registro.series = datos.series
    registro.repeticiones = datos.repeticiones
    
    db.commit()
    db.refresh(registro)
    return registro

@app.delete("/api/historial-ejercicios/{log_id}")
def eliminar_registro_historial(log_id: int, db: Session = Depends(get_db)):
    registro = db.query(models.HistorialEjercicio).filter(models.HistorialEjercicio.id == log_id).first()
    if not registro:
        raise HTTPException(status_code=404, detail="Registro de historial no encontrado")
    db.delete(registro)
    db.commit()
    return {"mensaje": "Registro de historial eliminado correctamente"}

# ==========================================
# 6. MÉTRICAS DASHBOARD ADMIN
# ==========================================
@app.get("/api/admin/dashboard-stats")
def obtener_metricas_dashboard(db: Session = Depends(get_db)):
    hoy = date.today()
    return {
        "clientes": {
            "total": db.query(models.Usuario).filter(models.Usuario.rol == models.RolUsuario.cliente).count(),
            "activos": db.query(models.Usuario).filter(models.Usuario.rol == models.RolUsuario.cliente, models.Usuario.estado == models.EstadoUsuario.activo).count(),
            "suspendidos": db.query(models.Usuario).filter(models.Usuario.rol == models.RolUsuario.cliente, models.Usuario.estado == models.EstadoUsuario.suspendido).count()
        },
        "equipo": {
            "total_monitores": db.query(models.Monitor).count(),
            "monitores_activos": db.query(models.Monitor).filter(models.Monitor.esta_activo == True).count()
        },
        "actividad_hoy": {
            "accesos_totales": db.query(models.AsistenciaQR).filter(func.date(models.AsistenciaQR.fecha_acceso) == hoy).count(),
            "accesos_denegados": db.query(models.AsistenciaQR).filter(func.date(models.AsistenciaQR.fecha_acceso) == hoy, models.AsistenciaQR.exito == False).count(),
            "reservas_realizadas": db.query(models.Reserva).filter(func.date(models.Reserva.fecha_reserva) == hoy).count()
        }
    }

@app.get("/api/admin/churn")
def obtener_churn(dias: int = 10, db: Session = Depends(get_db)):
    hoy = date.today()
    activos = db.query(models.Usuario).filter(
        models.Usuario.rol == models.RolUsuario.cliente, 
        models.Usuario.estado == models.EstadoUsuario.activo
    ).all()
    
    churn_list = []
    
    for u in activos:
        ultimo = db.query(models.AsistenciaQR).filter(
            models.AsistenciaQR.usuario_id == u.id, 
            models.AsistenciaQR.exito == True
        ).order_by(models.AsistenciaQR.fecha_acceso.desc()).first()
        
        if ultimo:
            delta = hoy - ultimo.fecha_acceso.date()
        else:
            delta = hoy - u.fecha_registro.date()
            
        if delta.days > dias:
            churn_list.append({
                "id": u.id,
                "nombre": u.nombre,
                "email": u.email,
                "dias_sin_venir": delta.days,
                "plan": "Sin Plan" 
            })
            
    churn_list.sort(key=lambda x: x["dias_sin_venir"], reverse=True)
    return churn_list