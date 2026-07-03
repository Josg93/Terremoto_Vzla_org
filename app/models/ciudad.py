import uuid

from sqlmodel import Field, SQLModel


class Ciudad(SQLModel, table=True):
    __tablename__ = "ciudades"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    estado_id: str = Field(foreign_key="estados.id", nullable=False)
    nombre: str = Field(max_length=127, nullable=False)
