from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
from core.email_service import enviar_correo_reserva_async # Importamos el servicio

router = APIRouter()

@router.post("/", response_model=schemas.ReservaResponse)
def crear_reserva(
    reserva: schemas.ReservaCreate, 
    background_tasks: BackgroundTasks, # <-- 1. Añadimos BackgroundTasks
    db: Session = Depends(get_db)
):
    # 2. Verificamos si la clase existe y hay aforo
    clase = db.query(models.Clase).filter(models.Clase.id == reserva.clase_id).first()
    if not clase:
        raise HTTPException(status_code=404, detail="Clase no encontrada")

    reservas_actuales = db.query(models.Reserva).filter(models.Reserva.clase_id == clase.id).count()
    if reservas_actuales >= clase.capacidad_maxima:
        raise HTTPException(status_code=400, detail="La clase está llena")

    # 3. Guardamos la reserva
    nueva_reserva = models.Reserva(usuario_id=reserva.usuario_id, clase_id=reserva.clase_id)
    db.add(nueva_reserva)
    db.commit()
    db.refresh(nueva_reserva)

    # 4. Obtenemos los datos del usuario para el correo
    usuario = db.query(models.Usuario).filter(models.Usuario.id == reserva.usuario_id).first()
    
    # 5. ¡DISPARAMOS EL CORREO EN SEGUNDO PLANO! 🚀
    if usuario and usuario.email:
        fecha_formateada = clase.hora_inicio.strftime("%d/%m/%Y a las %H:%M")
        enviar_correo_reserva_async(
            background_tasks=background_tasks,
            email_usuario=usuario.email,
            nombre_usuario=usuario.nombre,
            nombre_clase=clase.nombre,
            fecha_clase=fecha_formateada
        )

    return nueva_reserva