import bcrypt
# Mock bcrypt.__about__ for passlib compatibility in Python 3.12+
if not hasattr(bcrypt, "__about__"):
    class MockAbout:
        __version__ = getattr(bcrypt, "__version__", "4.0.1")
    bcrypt.__about__ = MockAbout()

from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status

def verificar_usuario_activo(current_user: User):
    if current_user.estado != "activo":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Acceso denegado. Tu cuenta está en estado: {current_user.estado}. Motivo: {current_user.motivo_suspension}"
        )
    return current_user

# 1. Configuración de encriptación (Usamos bcrypt, el estándar de la industria)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

import os

# 2. Configuración del Token JWT
# IMPORTANTE: En la vida real esta clave secreta va en un archivo oculto (.env)
SECRET_KEY = os.getenv("SECRET_KEY", "tu_super_clave_secreta_super_larga_y_segura_para_el_gym") 
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = 60 # El token caduca en 1 hora por seguridad

# --- FUNCIONES PARA CONTRASEÑAS ---

# Comprueba si la contraseña plana coincide con la encriptada
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

# Encripta una contraseña plana antes de guardarla en la Base de Datos
def get_password_hash(password):
    return pwd_context.hash(password)

# --- FUNCIONES PARA TOKENS ---

# Genera el "carnet digital" (JWT)
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    # Metemos la fecha de caducidad en los datos del token
    to_encode.update({"exp": expire})
    
    # Firmamos el token matemáticamente con nuestra clave secreta
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt