import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from main import iniciar_sesion, LoginRequest

db = SessionLocal()
req = LoginRequest(email="cliente@irongym.com", password="iron123")
try:
    print(iniciar_sesion(req, db))
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.close()
