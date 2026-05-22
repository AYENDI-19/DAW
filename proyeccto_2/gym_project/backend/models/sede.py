from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from .base import Base

class Sede(Base):
    __tablename__ = "sedes"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    direccion = Column(String(255))
    telefono = Column(String(20))
    email = Column(String(100))
    activa = Column(Boolean, default=True)

    usuarios = relationship("Usuario", back_populates="sede")
    # Agrega más relaciones según sea necesario
