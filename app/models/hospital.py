import uuid

from sqlmodel import Field, SQLModel


class Hospital(SQLModel, table=True):
    __tablename__ = "hospitales"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    ciudad_id: str = Field(foreign_key="ciudades.id", nullable=False)
    nombre: str = Field(max_length=255, nullable=False)
