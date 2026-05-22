# schemas/clase.py
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional
from models.clase import EstadoClase

class ClaseBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    entrenador_id: int
    aforo_maximo: int
    fecha_inicio: datetime
    fecha_fin: datetime

class ClaseCreate(ClaseBase):
    pass

class ClaseOut(ClaseBase):
    id: int
    estado: EstadoClase
    entrenador_nombre: Optional[str] = None
    reservas_count: Optional[int] = 0
    clientes_inscritos: Optional[list[dict]] = []
    model_config = ConfigDict(from_attributes=True)