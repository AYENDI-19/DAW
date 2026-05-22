from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
import models, schemas
from database import get_db
from core import security

router = APIRouter()

@router.post("/", response_model=schemas.UsuarioResponse)
def crear_usuario(usuario: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    hashed_pass = security.get_password_hash(usuario.password)
    nuevo_usuario = models.Usuario(
        nombre=usuario.nombre, 
        email=usuario.email, 
        telefono=usuario.telefono,
        rol=usuario.rol,
        hashed_password=hashed_pass 
    )
    try:
        db.add(nuevo_usuario) 
        db.commit()           
        db.refresh(nuevo_usuario) 
        return nuevo_usuario
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Este email ya está registrado.")

@router.get("/", response_model=list[schemas.UsuarioResponse])
def obtener_usuarios(db: Session = Depends(get_db)):
    return db.query(models.Usuario).all()