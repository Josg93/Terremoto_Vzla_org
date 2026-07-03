import uuid

from sqlmodel import Field, SQLModel


class Necesidad(SQLModel, table=True):
    __tablename__ = "necesidades"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    categoria: str = Field(nullable=False)
    descripcion: str = Field(nullable=False)
    satisfecha: bool = Field(default=False)
