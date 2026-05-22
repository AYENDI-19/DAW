from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class AuditoriaOut(BaseModel):
    id: int
    usuario_id: Optional[int]
    accion: str
    tabla_afectada: Optional[str]
    registro_afectado_id: Optional[int]
    fecha: datetime
    ip_origen: Optional[str]
    model_config = ConfigDict(from_attributes=True)