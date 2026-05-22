from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime
from typing import Optional, List
# ANTES: from ..models.usuario import RolUsuario, EstadoUsuario
from models.usuario import RolUsuario, EstadoUsuario

# Esquema base con campos comunes
class UsuarioBase(BaseModel):
    nombre: str
    email: EmailStr
    telefono: Optional[str] = None
    rol: RolUsuario = RolUsuario.cliente

# Para crear un usuario (ej. Registro)
class UsuarioCreate(UsuarioBase):
    password: str
    foto_perfil: Optional[str] = None  # Base64

# Alta rápida desde el Admin (solo email + password + foto opcional)
class AdminClienteCreate(BaseModel):
    email: EmailStr
    password: str
    nombre: Optional[str] = None       # Si no se da, se usa parte del email
    telefono: Optional[str] = None
    foto_perfil: Optional[str] = None  # Base64 de la webcam

# Para que el Administrador actualice estados o motivos
class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = None
    telefono: Optional[str] = None
    estado: Optional[EstadoUsuario] = None
    motivo_suspension: Optional[str] = None
    membresia_activa: Optional[bool] = None
    plan_id: Optional[int] = None
    foto_perfil: Optional[str] = None  # Base64

# Lo que la API devuelve (Response)
class UsuarioOut(UsuarioBase):
    id: int
    estado: EstadoUsuario
    motivo_suspension: Optional[str] = None
    membresia_activa: bool
    fecha_fin_membresia: Optional[datetime] = None
    fecha_registro: datetime
    foto_perfil: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)