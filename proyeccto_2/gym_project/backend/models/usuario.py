import enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .base import Base, TenantMixin, SoftDeleteMixin

class RolUsuario(str, enum.Enum):
    admin = "admin"
    entrenador = "entrenador"
    cliente = "cliente"
    recepcionista = "recepcionista"

class EstadoUsuario(str, enum.Enum):
    activo = "activo"
    suspendido = "suspendido"
    bloqueado = "bloqueado"
    baja = "baja"
    pendiente = "pendiente"

class Usuario(Base, TenantMixin, SoftDeleteMixin):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    telefono = Column(String(20))
    foto_perfil = Column(Text, nullable=True)  # Base64 encoded photo
    rol = Column(Enum(RolUsuario), default=RolUsuario.cliente)
    
    estado = Column(Enum(EstadoUsuario), default=EstadoUsuario.activo)
    motivo_suspension = Column(Text, nullable=True)
    membresia_activa = Column(Boolean, default=False)
    fecha_fin_membresia = Column(DateTime, nullable=True)
    plan_id = Column(Integer, ForeignKey("planes_membresia.id", ondelete="SET NULL"), nullable=True)
    fecha_registro = Column(DateTime, server_default=func.now())

    # Relaciones (usamos strings para evitar importaciones circulares)
    sede = relationship("Sede", back_populates="usuarios")
    plan = relationship("PlanMembresia", back_populates="usuarios")
    datos_monitor = relationship("Monitor", back_populates="usuario", uselist=False, cascade="all, delete-orphan")
    asistencias = relationship("AsistenciaQR", back_populates="usuario", cascade="all, delete-orphan")
    pagos = relationship("Pago", back_populates="usuario", cascade="all, delete-orphan")
    reservas = relationship("Reserva", back_populates="usuario", cascade="all, delete-orphan")
    progresos = relationship("ProgresoFisico", back_populates="usuario", cascade="all, delete-orphan")