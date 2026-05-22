from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, DateTime, ForeignKey
import datetime

Base = declarative_base()

class TenantMixin:
    sede_id = Column(Integer, ForeignKey("sedes.id"), nullable=True) # Temporalmente True para migración

class SoftDeleteMixin:
    deleted_at = Column(DateTime, nullable=True)

    def delete(self, db):
        self.deleted_at = datetime.datetime.now()
        db.add(self)
        db.commit()