from pydantic import BaseModel, ConfigDict
from typing import Optional

class MonitorBase(BaseModel):
    especialidad: str
    biografia: Optional[str] = None
    esta_activo: bool = True

class MonitorCreate(MonitorBase):
    usuario_id: int

class MonitorOut(MonitorBase):
    id: int
    usuario_id: int
    model_config = ConfigDict(from_attributes=True)