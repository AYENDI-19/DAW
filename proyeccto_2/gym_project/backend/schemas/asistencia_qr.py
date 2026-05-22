from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class AsistenciaQRBase(BaseModel):
    usuario_id: int

class AsistenciaQRCreate(AsistenciaQRBase):
    exito: bool
    error_msg: Optional[str] = None

class AsistenciaQROut(AsistenciaQRBase):
    id: int
    fecha_acceso: datetime
    exito: bool
    error_msg: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)