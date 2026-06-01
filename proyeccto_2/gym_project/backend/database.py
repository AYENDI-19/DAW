import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import NullPool
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Conexión a MySQL (con fallback)
URL_BASE_DATOS = os.getenv("DATABASE_URL", "mysql+pymysql://root:1@localhost:3306/gym_db")
if URL_BASE_DATOS.startswith("mysql://"):
    URL_BASE_DATOS = URL_BASE_DATOS.replace("mysql://", "mysql+pymysql://", 1)

# Usamos NullPool para cerrar las conexiones inmediatamente al terminar la petición
# Esto es crítico para bases de datos gratuitas (como Clever Cloud) que limitan las conexiones simultáneas (max 5)
engine = create_engine(URL_BASE_DATOS, poolclass=NullPool)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()