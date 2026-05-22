from pydantic import BaseModel, ConfigDict
from decimal import Decimal

class PlanMembresiaBase(BaseModel):
    nombre: str
    precio: Decimal
    duracion_dias: int

class PlanMembresiaCreate(PlanMembresiaBase):
    pass

class PlanMembresiaOut(PlanMembresiaBase):
    id: int
    model_config = ConfigDict(from_attributes=True)