import enum
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, DECIMAL
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .base import Base

class EstadoPago(str, enum.Enum):
    completado = "completado"
    fallido = "fallido"
    reembolsado = "reembolsado"

class Pago(Base):
    __tablename__ = "pagos"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    plan_id = Column(Integer, ForeignKey("planes_membresia.id", ondelete="SET NULL"), nullable=True)
    monto = Column(DECIMAL(10, 2), nullable=False)
    fecha_pago = Column(DateTime, server_default=func.now())
    metodo_pago = Column(String(50))
    estado = Column(Enum(EstadoPago), default=EstadoPago.completado)

    usuario = relationship("Usuario", back_populates="pagos")
    plan = relationship("PlanMembresia")