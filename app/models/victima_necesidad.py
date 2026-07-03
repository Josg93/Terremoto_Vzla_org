from sqlmodel import Field, SQLModel


class VictimaNecesidad(SQLModel, table=True):
    __tablename__ = "victimas_necesidades"

    necesidad_id: str = Field(foreign_key="necesidades.id", primary_key=True)
    victima_cedula: str = Field(foreign_key="victimas.cedula", primary_key=True)
