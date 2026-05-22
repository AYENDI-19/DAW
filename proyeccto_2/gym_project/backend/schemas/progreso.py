from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ProgresoCreate(BaseModel):
    usuario_id: int
    peso_kg: float
    porcentaje_grasa: Optional[float] = None
    masa_muscular_kg: Optional[float] = None

class ProgresoResponse(ProgresoCreate):
    id: int
    fecha_registro: datetime

    class Config:
        from_attributes = True