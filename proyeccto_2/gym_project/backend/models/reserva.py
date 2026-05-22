import enum
from sqlalchemy import Column, Integer, DateTime, ForeignKey, Enum, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .base import Base

class EstadoReserva(str, enum.Enum):
    confirmada = "confirmada"
    cancelada = "cancelada"
    lista_espera = "lista_espera"

class Reserva(Base):
    __tablename__ = "reservas"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    clase_id = Column(Integer, ForeignKey("clases.id", ondelete="CASCADE"), nullable=False)
    fecha_reserva = Column(DateTime, server_default=func.now())
    estado = Column(Enum(EstadoReserva), default=EstadoReserva.confirmada)

    usuario = relationship("Usuario", back_populates="reservas")
    clase = relationship("Clase", back_populates="reservas")

    __table_args__ = (UniqueConstraint('usuario_id', 'clase_id', name='unique_reserva_usuario_clase'),)