from sqlalchemy import Column, Integer, String, DECIMAL
from sqlalchemy.orm import relationship
from .base import Base

class PlanMembresia(Base):
    __tablename__ = "planes_membresia"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    precio = Column(DECIMAL(10, 2), nullable=False)
    duracion_dias = Column(Integer, nullable=False)

    usuarios = relationship("Usuario", back_populates="plan")