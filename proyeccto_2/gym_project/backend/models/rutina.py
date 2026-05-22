from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .base import Base

class Rutina(Base):
    __tablename__ = "rutinas"
    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    entrenador_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    nombre = Column(String(100), nullable=False)
    descripcion = Column(Text)
    fecha_creacion = Column(DateTime, server_default=func.now())

    cliente = relationship("Usuario", foreign_keys=[cliente_id])
    entrenador = relationship("Usuario", foreign_keys=[entrenador_id])
    ejercicios = relationship("EjercicioRutina", back_populates="rutina", cascade="all, delete-orphan")

class EjercicioRutina(Base):
    __tablename__ = "ejercicios_rutina"
    id = Column(Integer, primary_key=True, index=True)
    rutina_id = Column(Integer, ForeignKey("rutinas.id", ondelete="CASCADE"), nullable=False)
    nombre_ejercicio = Column(String(100), nullable=False)
    series = Column(Integer, nullable=False)
    repeticiones = Column(String(50), nullable=False)
    descanso_segundos = Column(Integer)
    peso_sugerido = Column(Integer, nullable=True)
    multimedia = Column(Text, nullable=True)  # URL de video o imagen

    rutina = relationship("Rutina", back_populates="ejercicios")

class HistorialEjercicio(Base):
    __tablename__ = "historial_ejercicios"
    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    ejercicio_nombre = Column(String(100), nullable=False)
    fecha = Column(DateTime, server_default=func.now())
    peso = Column(Integer, nullable=False)
    series = Column(Integer, nullable=False)
    repeticiones = Column(String(50), nullable=False)

    cliente = relationship("Usuario", foreign_keys=[cliente_id])