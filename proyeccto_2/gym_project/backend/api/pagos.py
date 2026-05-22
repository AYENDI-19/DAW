from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from pydantic import BaseModel

from models.pago import Pago
from models.usuario import Usuario
from models.membresia import PlanMembresia
from database import get_db

router = APIRouter()

# Esquema rápido solo para recibir el pago
class PagoSimulado(BaseModel):
    usuario_id: int
    plan_id: int
    metodo_pago: str # Ej: "Tarjeta", "Efectivo"

@router.post("/procesar")
def procesar_pago_y_activar(pago_data: PagoSimulado, db: Session = Depends(get_db)):
    # 1. Buscamos al usuario
    usuario = db.query(Usuario).filter(Usuario.id == pago_data.usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
    # 2. Buscamos el plan que quiere comprar
    plan = db.query(PlanMembresia).filter(PlanMembresia.id == pago_data.plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="El plan no existe")

    # 3. Registramos la factura / pago
    nuevo_pago = Pago(
        usuario_id=usuario.id,
        monto=plan.precio,
        metodo_pago=pago_data.metodo_pago,
        estado="Completado"
    )
    db.add(nuevo_pago)

    # 4. REGLA DE NEGOCIO: Activamos al usuario y le sumamos los días
    usuario.membresia_activa = True
    usuario.plan_id = plan.id
    
    # Si ya tenía días acumulados, se los sumamos. Si no, contamos desde hoy.
    hoy = datetime.now()
    if usuario.fecha_fin_membresia and usuario.fecha_fin_membresia > hoy:
        usuario.fecha_fin_membresia += timedelta(days=plan.duracion_dias)
    else:
        usuario.fecha_fin_membresia = hoy + timedelta(days=plan.duracion_dias)

    db.commit()
    
    return {
        "mensaje": "Pago procesado con éxito.",
        "cliente": usuario.nombre,
        "membresia_activa_hasta": usuario.fecha_fin_membresia.strftime("%Y-%m-%d"),
        "total_pagado": plan.precio
    }