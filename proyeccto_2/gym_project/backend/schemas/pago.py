from pydantic import BaseModel, ConfigDict
from datetime import datetime
from decimal import Decimal
from models.pago import EstadoPago
class PagoCreate(BaseModel):
    usuario_id: int
    plan_id: int
    monto: Decimal
    metodo_pago: str

class PagoOut(BaseModel):
    id: int
    fecha_pago: datetime
    estado: EstadoPago
    model_config = ConfigDict(from_attributes=True)