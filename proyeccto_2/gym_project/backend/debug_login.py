"""
Script para debuggear el error 500 del login.
"""
import sys, os, traceback
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
import models

db = SessionLocal()

print("=" * 60)
print("TEST 1: Buscar usuario en BD")
try:
    usuario = db.query(models.Usuario).filter(models.Usuario.email == "cliente@irongym.com").first()
    if usuario:
        print(f"  OK Usuario encontrado: {usuario.nombre}")
        print(f"     rol: {usuario.rol}")
        print(f"     rol type: {type(usuario.rol)}")
        print(f"     rol.value: {usuario.rol.value}")
        print(f"     estado: {usuario.estado}")
        print(f"     membresia_activa: {usuario.membresia_activa}")
    else:
        print("  ERROR Usuario NO encontrado en BD")
except Exception as e:
    print(f"  ERROR al buscar usuario: {e}")
    traceback.print_exc()

print("\nTEST 2: Verificar password")
try:
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    ok = pwd_context.verify("iron123", usuario.hashed_password)
    print(f"  Password correcta: {ok}")
except Exception as e:
    print(f"  ERROR: {e}")
    traceback.print_exc()

print("\nTEST 3: Generar JWT")
try:
    import jwt
    from datetime import datetime, timedelta
    SECRET_KEY = "iron_gym_super_secret_key"
    ALGORITHM = "HS256"
    payload = {
        "sub": usuario.email,
        "id": usuario.id,
        "rol": usuario.rol.value,
        "exp": datetime.utcnow() + timedelta(days=7)
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    print(f"  Token generado OK: {str(token)[:50]}...")
except Exception as e:
    print(f"  ERROR JWT: {e}")
    traceback.print_exc()

print("\nTEST 4: Construir respuesta JSON")
try:
    import json
    respuesta = {
        "access_token": token,
        "token_type": "bearer",
        "usuario": {
            "id": usuario.id,
            "nombre": usuario.nombre,
            "rol": usuario.rol.value
        }
    }
    print(f"  JSON OK: {json.dumps(respuesta)[:100]}...")
except Exception as e:
    print(f"  ERROR al serializar: {e}")
    traceback.print_exc()

print("\nTEST 5: Comprobar email_service import")
try:
    from core import email_service
    print("  email_service importado OK")
except Exception as e:
    print(f"  ERROR importando email_service: {e}")
    traceback.print_exc()

db.close()
print("\n" + "=" * 60)
print("FIN DEL DIAGNOSTICO")
