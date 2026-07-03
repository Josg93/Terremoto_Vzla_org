from pydantic import BaseModel


class EstadoResponse(BaseModel):
    id: str
    nombre: str


class CiudadResponse(BaseModel):
    id: str
    estado_id: str
    nombre: str
