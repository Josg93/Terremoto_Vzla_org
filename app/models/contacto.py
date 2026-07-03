import uuid

from sqlmodel import Field, SQLModel


class Contacto(SQLModel, table=True):
    __tablename__ = "contactos"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    rol: str = Field(nullable=False)
    numero_telefono: str = Field(max_length=50, nullable=False)
    nombre_contacto: str | None = Field(max_length=255, default=None)
