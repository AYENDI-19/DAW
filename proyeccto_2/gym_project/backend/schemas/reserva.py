

# schemas/reserva.py
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from models.reserva import EstadoReserva
class ReservaCreate(BaseModel):
    usuario_id: int
    clase_id: int

class ReservaOut(BaseModel):
    id: int
    usuario_id: int
    clase_id: int
    fecha_reserva: datetime
    estado: EstadoReserva
    model_config = ConfigDict(from_attributes=True)