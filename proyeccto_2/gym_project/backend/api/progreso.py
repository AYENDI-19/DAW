from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from models.progreso import ProgresoFisico
import schemas
from database import get_db

router = APIRouter()

@router.post("/", response_model=schemas.ProgresoResponse)
def registrar_progreso(progreso: schemas.ProgresoCreate, db: Session = Depends(get_db)):
    # Usamos model_dump() en lugar de dict() para Pydantic v2
    nuevo_progreso = ProgresoFisico(**progreso.model_dump())
    db.add(nuevo_progreso)
    db.commit()
    db.refresh(nuevo_progreso)
    return nuevo_progreso

@router.get("/cliente/{cliente_id}", response_model=list[schemas.ProgresoResponse])
def historial_progreso(cliente_id: int, db: Session = Depends(get_db)):
    # Devolvemos el historial ordenado por fecha (el más reciente primero)
    return db.query(ProgresoFisico).filter(ProgresoFisico.usuario_id == cliente_id).order_by(ProgresoFisico.fecha.desc()).all()