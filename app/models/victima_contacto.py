from sqlmodel import Field, SQLModel


class VictimaContacto(SQLModel, table=True):
    __tablename__ = "victimas_contactos"

    contacto_id: str = Field(foreign_key="contactos.id", primary_key=True)
    victima_cedula: str = Field(foreign_key="victimas.cedula", primary_key=True)
