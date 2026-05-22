from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from models.clase import Clase
import schemas
from database import get_db

router = APIRouter()

@router.post("/", response_model=schemas.ClaseResponse)
def crear_clase(clase: schemas.ClaseCreate, db: Session = Depends(get_db)):
    nueva_clase = Clase(**clase.dict())
    db.add(nueva_clase)
    db.commit()
    db.refresh(nueva_clase)
    return nueva_clase

@router.get("/", response_model=list[schemas.ClaseResponse])
def obtener_clases_disponibles(db: Session = Depends(get_db)):
    return db.query(Clase).filter(Clase.activa == True).all()