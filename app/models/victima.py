from datetime import datetime

from sqlmodel import Field, SQLModel


class Victima(SQLModel, table=True):
    __tablename__ = "victimas"

    cedula: str = Field(max_length=8, primary_key=True, regex=r"^[0-9]+$")
    nombre: str = Field(max_length=255, nullable=False)
    apellidos: str = Field(max_length=511, nullable=False)
    status: str = Field(nullable=False)
    hospital_id: str = Field(foreign_key="hospitales.id", nullable=False)
    fecha_de_registro: datetime = Field(default_factory=datetime.now)
