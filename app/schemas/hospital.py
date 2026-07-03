from pydantic import BaseModel


class HospitalCreate(BaseModel):
    nombre: str
    ciudad_id: str


class HospitalResponse(BaseModel):
    id: str
    nombre: str
    ciudad_id: str
    ciudad_nombre: str
    estado_nombre: str
