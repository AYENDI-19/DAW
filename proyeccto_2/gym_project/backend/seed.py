import bcrypt
# Mock bcrypt.__about__ for passlib compatibility in Python 3.12+
if not hasattr(bcrypt, "__about__"):
    class MockAbout:
        __version__ = getattr(bcrypt, "__version__", "4.0.1")
    bcrypt.__about__ = MockAbout()

import sys
import os
from datetime import datetime, timedelta

# Añadir el directorio actual al path para importar modelos y base de datos
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine
import models

def seed():
    db = SessionLocal()
    try:
        # 1. Limpiar datos previos si es necesario (Opcional, ten cuidado)
        models.Base.metadata.drop_all(bind=engine)
        models.Base.metadata.create_all(bind=engine)

        print("Iniciando seeding de IRON GYM...")

        # 2. Crear Planes de Membresía
        planes = [
            models.PlanMembresia(nombre="Basic Pass", precio=29.99, duracion_dias=30),
            models.PlanMembresia(nombre="Iron Elite", precio=49.99, duracion_dias=30),
            models.PlanMembresia(nombre="Annual Pro", precio=450.00, duracion_dias=365),
        ]
        db.add_all(planes)
        db.flush()

        # 3. Crear Usuarios de Prueba
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        hashed_pwd = pwd_context.hash("iron123")

        usuarios = [
            models.Usuario(
                nombre="Admin Iron",
                email="admin@irongym.com",
                hashed_password=hashed_pwd,
                rol=models.RolUsuario.admin,
                estado=models.EstadoUsuario.activo
            ),
            models.Usuario(
                nombre="Ana Recepcion",
                email="recepcion@irongym.com",
                hashed_password=hashed_pwd,
                rol=models.RolUsuario.recepcionista,
                estado=models.EstadoUsuario.activo
            ),
            models.Usuario(
                nombre="Juan Trainer",
                email="trainer@irongym.com",
                hashed_password=hashed_pwd,
                rol=models.RolUsuario.entrenador,
                estado=models.EstadoUsuario.activo
            ),
            models.Usuario(
                nombre="Carlos Cliente",
                email="cliente@irongym.com",
                hashed_password=hashed_pwd,
                rol=models.RolUsuario.cliente,
                estado=models.EstadoUsuario.activo,
                membresia_activa=True,
                fecha_fin_membresia=datetime.now() + timedelta(days=30),
                plan_id=planes[1].id
            )
        ]
        db.add_all(usuarios)
        db.flush()

        # 4. Crear Monitor (Asociado al usuario Juan Trainer)
        monitor = models.Monitor(usuario_id=usuarios[2].id, especialidad="Crossfit & HIIT", esta_activo=True)
        db.add(monitor)
        db.flush()

        # 5. Crear Clases
        clases = [
            models.Clase(
                nombre="Crossfit WOD",
                descripcion="Entrenamiento del dia de alta intensidad.",
                entrenador_id=usuarios[2].id, # Referenciamos al Usuario (entrenador)
                aforo_maximo=15,
                fecha_inicio=datetime.now() + timedelta(hours=2),
                fecha_fin=datetime.now() + timedelta(hours=3),
                estado=models.EstadoClase.activa
            ),
            models.Clase(
                nombre="Yoga Flow",
                descripcion="Sesion de movilidad y relajacion.",
                entrenador_id=usuarios[2].id, # Referenciamos al Usuario (entrenador)
                aforo_maximo=20,
                fecha_inicio=datetime.now() + timedelta(days=1, hours=10),
                fecha_fin=datetime.now() + timedelta(days=1, hours=11),
                estado=models.EstadoClase.activa
            )
        ]

        db.add_all(clases)
        
        db.commit()
        print("Seeding completado con exito.")
        print("---")
        print("Cuentas de prueba (Password: iron123):")
        print("- Admin: admin@irongym.com")
        print("- Recepcionista: recepcion@irongym.com")
        print("- Trainer: trainer@irongym.com")
        print("- Cliente: cliente@irongym.com")

    except Exception as e:
        db.rollback()
        print(f"Error durante el seeding: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
