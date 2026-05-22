from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .base import Base

class Auditoria(Base):
    __tablename__ = "auditoria"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    accion = Column(String(255), nullable=False)
    tabla_afectada = Column(String(100))
    registro_afectado_id = Column(Integer)
    fecha = Column(DateTime, server_default=func.now())
    ip_origen = Column(String(50))

    usuario = relationship("Usuario")