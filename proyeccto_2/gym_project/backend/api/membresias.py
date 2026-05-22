from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from models.membresia import PlanMembresia
import schemas
from database import get_db

router = APIRouter()

@router.post("/", response_model=schemas.PlanMembresiaResponse)
def crear_plan(plan: schemas.PlanMembresiaCreate, db: Session = Depends(get_db)):
    nuevo_plan = PlanMembresia(**plan.dict())
    db.add(nuevo_plan)
    db.commit()
    db.refresh(nuevo_plan)
    return nuevo_plan

@router.get("/", response_model=list[schemas.PlanMembresiaResponse])
def obtener_planes(db: Session = Depends(get_db)):
    # Solo devolvemos los planes que estén activos para que la gente los compre
    return db.query(PlanMembresia).filter(PlanMembresia.activo == True).all()