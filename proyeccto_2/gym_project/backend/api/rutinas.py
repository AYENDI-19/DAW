from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.rutina import Rutina, EjercicioRutina
from models.usuario import Usuario
import schemas
from database import get_db

router = APIRouter()

@router.post("/", response_model=schemas.RutinaResponse)
def crear_rutina(rutina_data: schemas.RutinaCreate, db: Session = Depends(get_db)):
    # Verificamos que el cliente y el entrenador existen
    cliente = db.query(Usuario).filter(Usuario.id == rutina_data.cliente_id).first()
    entrenador = db.query(Usuario).filter(Usuario.id == rutina_data.entrenador_id).first()
    
    if not cliente or not entrenador:
        raise HTTPException(status_code=404, detail="Cliente o Entrenador no encontrados")

    # 1. Creamos la Rutina base
    nueva_rutina = Rutina(
        cliente_id=rutina_data.cliente_id,
        entrenador_id=rutina_data.entrenador_id,
        nombre=rutina_data.nombre,
        descripcion=rutina_data.descripcion
    )
    db.add(nueva_rutina)
    db.commit()
    db.refresh(nueva_rutina)

    # 2. Añadimos los ejercicios a esa rutina
    for ej in rutina_data.ejercicios:
        nuevo_ejercicio = EjercicioRutina(
            rutina_id=nueva_rutina.id,
            nombre_ejercicio=ej.nombre_ejercicio,
            series=ej.series,
            repeticiones=ej.repeticiones,
            descanso_segundos=ej.descanso_segundos
        )
        db.add(nuevo_ejercicio)
    
    db.commit()
    db.refresh(nueva_rutina)
    return nueva_rutina

@router.get("/cliente/{cliente_id}", response_model=list[schemas.RutinaResponse])
def obtener_rutinas_cliente(cliente_id: int, db: Session = Depends(get_db)):
    return db.query(Rutina).filter(Rutina.cliente_id == cliente_id).all()