from typing import List, Optional

from pydantic import BaseModel, Field


class ContactoBase(BaseModel):
    rol: str = Field(..., description="familiar | unidad_hospitalaria")
    numero_telefono: str
    nombre_contacto: Optional[str] = None


class ContactoResponse(ContactoBase):
    id: str


class NecesidadBase(BaseModel):
    categoria: str = Field(..., description="medicamento | sangre | insumo")
    descripcion: str
    satisfecha: bool = False


class NecesidadResponse(NecesidadBase):
    id: str


class VictimaCreate(BaseModel):
    cedula: str = Field(..., max_length=8, pattern="^[0-9]+$")
    nombre: str
    apellidos: str
    status: str = Field("estable", description="estable | critico | alta | fallecido | desaparecido")
    hospital_id: str
    necesidades: List[NecesidadBase] = []
    contactos: List[ContactoBase] = []


class VictimaUpdate(BaseModel):
    nombre: Optional[str] = None
    apellidos: Optional[str] = None
    status: Optional[str] = None
    hospital_id: Optional[str] = None


class VictimaResponse(BaseModel):
    cedula: str
    nombre: str
    apellidos: str
    status: str
    hospital_id: str
    hospital_nombre: str
    ciudad_nombre: str
    estado_nombre: str
    fecha_de_registro: str
    necesidades: List[NecesidadResponse] = []
    contactos: List[ContactoResponse] = []
