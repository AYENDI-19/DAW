from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from .base import Base

class Monitor(Base):
    __tablename__ = "monitores"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), unique=True)
    especialidad = Column(String(100))
    biografia = Column(Text, nullable=True)
    esta_activo = Column(Boolean, default=True)

    usuario = relationship("Usuario", back_populates="datos_monitor")