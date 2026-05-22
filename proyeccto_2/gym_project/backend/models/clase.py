import enum
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from .base import Base, TenantMixin, SoftDeleteMixin

class EstadoClase(str, enum.Enum):
    activa = "activa"
    cancelada = "cancelada"
    finalizada = "finalizada"

class Clase(Base, TenantMixin, SoftDeleteMixin):
    __tablename__ = "clases"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    descripcion = Column(Text)
    entrenador_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    aforo_maximo = Column(Integer, nullable=False)
    fecha_inicio = Column(DateTime, nullable=False)
    fecha_fin = Column(DateTime, nullable=False)
    estado = Column(Enum(EstadoClase), default=EstadoClase.activa)

    entrenador = relationship("Usuario")
    reservas = relationship("Reserva", back_populates="clase", cascade="all, delete-orphan")