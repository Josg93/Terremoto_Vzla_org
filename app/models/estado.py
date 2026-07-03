import uuid

from sqlmodel import Field, SQLModel


class Estado(SQLModel, table=True):
    __tablename__ = "estados"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    nombre: str = Field(max_length=127, nullable=False)
