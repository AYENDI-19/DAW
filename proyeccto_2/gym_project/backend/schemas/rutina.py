from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class EjercicioBase(BaseModel):
    nombre_ejercicio: str
    series: int
    repeticiones: str
    descanso_segundos: Optional[int] = 90
    peso_sugerido: Optional[int] = 0
    multimedia: Optional[str] = None

class RutinaCreate(BaseModel):
    cliente_id: int
    entrenador_id: Optional[int] = None
    nombre: str
    descripcion: Optional[str] = None
    ejercicios: List[EjercicioBase]

class RutinaResponse(BaseModel):
    id: int
    cliente_id: int
    entrenador_id: Optional[int] = None
    nombre: str
    descripcion: Optional[str] = None
    fecha_creacion: datetime
    ejercicios: List[EjercicioBase]

    class Config:
        from_attributes = True

class HistorialEjercicioBase(BaseModel):
    ejercicio_nombre: str
    peso: int
    series: int
    repeticiones: str

class HistorialEjercicioCreate(HistorialEjercicioBase):
    cliente_id: int

class HistorialEjercicioOut(HistorialEjercicioBase):
    id: int
    cliente_id: int
    fecha: datetime

    class Config:
        from_attributes = True