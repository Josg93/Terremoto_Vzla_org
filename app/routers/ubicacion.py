import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select

from app.database.database import get_session
from app.models import Ciudad, Estado, Hospital
from app.schemas import CiudadResponse, EstadoResponse, HospitalCreate, HospitalResponse

router = APIRouter(tags=["Ubicación y Centros de Salud"])


@router.get("/api/v1/estados", response_model=list[EstadoResponse])
def get_estados(session: Session = Depends(get_session)):
    return session.exec(select(Estado)).all()


@router.get("/api/v1/ciudades", response_model=list[CiudadResponse])
def get_ciudades(
    estado_id: Optional[str] = Query(None),
    session: Session = Depends(get_session),
):
    query = select(Ciudad)
    if estado_id:
        query = query.where(Ciudad.estado_id == estado_id)
    return session.exec(query).all()


@router.get("/api/v1/hospitales", response_model=list[HospitalResponse])
def get_hospitales(
    estado_id: Optional[str] = Query(None),
    ciudad_id: Optional[str] = Query(None),
    session: Session = Depends(get_session),
):
    query = select(Hospital)
    if ciudad_id:
        query = query.where(Hospital.ciudad_id == ciudad_id)

    hospitals = session.exec(query).all()

    result = []
    for h in hospitals:
        ciudad = session.get(Ciudad, h.ciudad_id)
        if estado_id and (not ciudad or ciudad.estado_id != estado_id):
            continue
        estado = session.get(Estado, ciudad.estado_id) if ciudad else None
        result.append(
            HospitalResponse(
                id=h.id,
                nombre=h.nombre,
                ciudad_id=h.ciudad_id,
                ciudad_nombre=ciudad.nombre if ciudad else "Desconocida",
                estado_nombre=estado.nombre if estado else "Desconocido",
            )
        )

    return result


@router.post("/api/v1/hospitales", status_code=status.HTTP_201_CREATED)
def create_hospital(hosp: HospitalCreate, session: Session = Depends(get_session)):
    ciudad = session.get(Ciudad, hosp.ciudad_id)
    if not ciudad:
        raise HTTPException(status_code=400, detail="La ciudad especificada no existe")

    hosp_id = str(uuid.uuid4())
    db_hospital = Hospital(id=hosp_id, ciudad_id=hosp.ciudad_id, nombre=hosp.nombre)
    session.add(db_hospital)
    session.commit()
    session.refresh(db_hospital)
    return db_hospital
