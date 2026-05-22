from sqlalchemy import Column, Integer, DateTime, ForeignKey, Text, DECIMAL
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .base import Base

class ProgresoFisico(Base):
    __tablename__ = "progreso_fisico"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    fecha = Column(DateTime, server_default=func.now())
    peso = Column(DECIMAL(5, 2))
    porcentaje_grasa = Column(DECIMAL(5, 2))
    masa_muscular = Column(DECIMAL(5, 2))
    notas = Column(Text)

    usuario = relationship("Usuario", back_populates="progresos")