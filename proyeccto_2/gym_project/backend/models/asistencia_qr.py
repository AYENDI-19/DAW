from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .base import Base

class AsistenciaQR(Base):
    __tablename__ = "asistencias_qr"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"))
    fecha_acceso = Column(DateTime, server_default=func.now())
    exito = Column(Boolean, default=True)
    error_msg = Column(String(255), nullable=True)

    usuario = relationship("Usuario", back_populates="asistencias")