import enum

from sqlmodel import SQLModel


class CategoriaNecesidad(str, enum.Enum):
    medicamento = "medicamento"
    sangre = "sangre"
    insumo = "insumo"


class RolContacto(str, enum.Enum):
    familiar = "familiar"
    unidad_hospitalaria = "unidad_hospitalaria"


class StatusVictima(str, enum.Enum):
    estable = "estable"
    critico = "critico"
    alta = "alta"
    fallecido = "fallecido"
    desaparecido = "desaparecido"


Base = SQLModel
