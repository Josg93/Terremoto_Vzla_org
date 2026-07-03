import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select

from app.database.database import get_session
from app.models import (
    Ciudad,
    Contacto,
    Estado,
    Hospital,
    Necesidad,
    Victima,
    VictimaContacto,
    VictimaNecesidad,
)
from app.schemas import (
    ContactoResponse,
    NecesidadResponse,
    VictimaCreate,
    VictimaResponse,
    VictimaUpdate,
)

router = APIRouter(tags=["Víctimas y Necesidades"])

STATUS_VALIDOS = {"estable", "critico", "alta", "fallecido", "desaparecido"}
CATEGORIAS_VALIDAS = {"medicamento", "sangre", "insumo"}
ROLES_VALIDOS = {"familiar", "unidad_hospitalaria"}


@router.get("/api/v1/victimas", response_model=list[VictimaResponse])
def get_victimas(
    search: Optional[str] = Query(None, description="Búsqueda por nombre, apellido o cédula"),
    status: Optional[str] = Query(None),
    estado_id: Optional[str] = Query(None),
    hospital_id: Optional[str] = Query(None),
    categoria_necesidad: Optional[str] = Query(None),
    session: Session = Depends(get_session),
):
    query = select(Victima)

    if hospital_id:
        query = query.where(Victima.hospital_id == hospital_id)
    if status:
        query = query.where(Victima.status == status)

    victimas = session.exec(query).all()
    results = []

    for v in victimas:
        hosp = session.get(Hospital, v.hospital_id)
        ciudad = session.get(Ciudad, hosp.ciudad_id) if hosp else None
        estado = session.get(Estado, ciudad.estado_id) if ciudad else None

        if estado_id and (not ciudad or ciudad.estado_id != estado_id):
            continue

        needs_rows = session.exec(
            select(Necesidad).join(VictimaNecesidad).where(VictimaNecesidad.victima_cedula == v.cedula)
        ).all()

        if categoria_necesidad and not any(n.categoria == categoria_necesidad for n in needs_rows):
            continue

        contact_rows = session.exec(
            select(Contacto).join(VictimaContacto).where(VictimaContacto.victima_cedula == v.cedula)
        ).all()

        if search:
            q = search.lower()
            if not (q in v.nombre.lower() or q in v.apellidos.lower() or q in v.cedula):
                continue

        results.append(
            VictimaResponse(
                cedula=v.cedula,
                nombre=v.nombre,
                apellidos=v.apellidos,
                status=v.status,
                hospital_id=v.hospital_id,
                hospital_nombre=hosp.nombre if hosp else "Desconocido",
                ciudad_nombre=ciudad.nombre if ciudad else "Desconocida",
                estado_nombre=estado.nombre if estado else "Desconocido",
                fecha_de_registro=v.fecha_de_registro.isoformat(),
                necesidades=[
                    NecesidadResponse(
                        id=n.id, categoria=n.categoria, descripcion=n.descripcion, satisfecha=n.satisfecha
                    )
                    for n in needs_rows
                ],
                contactos=[
                    ContactoResponse(
                        id=c.id, rol=c.rol, numero_telefono=c.numero_telefono, nombre_contacto=c.nombre_contacto
                    )
                    for c in contact_rows
                ],
            )
        )

    results.sort(key=lambda x: x.fecha_de_registro, reverse=True)
    return results


@router.post("/api/v1/victimas", status_code=status.HTTP_201_CREATED)
def create_victima(v_data: VictimaCreate, session: Session = Depends(get_session)):
    if session.get(Victima, v_data.cedula):
        raise HTTPException(
            status_code=400,
            detail=f"La víctima con cédula {v_data.cedula} ya se encuentra registrada.",
        )

    if not session.get(Hospital, v_data.hospital_id):
        raise HTTPException(status_code=400, detail="El hospital especificado no existe.")

    if v_data.status not in STATUS_VALIDOS:
        raise HTTPException(status_code=400, detail="Status de víctima inválido.")

    db_victima = Victima(
        cedula=v_data.cedula,
        nombre=v_data.nombre,
        apellidos=v_data.apellidos,
        status=v_data.status,
        hospital_id=v_data.hospital_id,
    )
    session.add(db_victima)
    session.flush()

    for nec in v_data.necesidades:
        if nec.categoria not in CATEGORIAS_VALIDAS:
            continue
        db_nec = Necesidad(
            id=str(uuid.uuid4()),
            categoria=nec.categoria,
            descripcion=nec.descripcion,
            satisfecha=nec.satisfecha,
        )
        session.add(db_nec)
        session.flush()
        session.add(VictimaNecesidad(necesidad_id=db_nec.id, victima_cedula=v_data.cedula))

    for con in v_data.contactos:
        if con.rol not in ROLES_VALIDOS:
            continue
        db_con = Contacto(
            id=str(uuid.uuid4()),
            rol=con.rol,
            numero_telefono=con.numero_telefono,
            nombre_contacto=con.nombre_contacto,
        )
        session.add(db_con)
        session.flush()
        session.add(VictimaContacto(contacto_id=db_con.id, victima_cedula=v_data.cedula))

    session.commit()
    return {"status": "success", "message": "Víctima registrada exitosamente", "cedula": v_data.cedula}


@router.put("/api/v1/victimas/{cedula}")
def update_victima(cedula: str, update_data: VictimaUpdate, session: Session = Depends(get_session)):
    v = session.get(Victima, cedula)
    if not v:
        raise HTTPException(status_code=404, detail="Víctima no encontrada")

    if update_data.nombre is not None:
        v.nombre = update_data.nombre
    if update_data.apellidos is not None:
        v.apellidos = update_data.apellidos
    if update_data.status is not None:
        if update_data.status not in STATUS_VALIDOS:
            raise HTTPException(status_code=400, detail="Status de víctima inválido")
        v.status = update_data.status
    if update_data.hospital_id is not None:
        if not session.get(Hospital, update_data.hospital_id):
            raise HTTPException(status_code=400, detail="El hospital no existe")
        v.hospital_id = update_data.hospital_id

    session.add(v)
    session.commit()
    return {"status": "success", "message": "Información de la víctima actualizada"}


@router.put("/api/v1/necesidades/{nec_id}")
def update_necesidad(nec_id: str, satisfied: bool = Query(...), session: Session = Depends(get_session)):
    nec = session.get(Necesidad, nec_id)
    if not nec:
        raise HTTPException(status_code=404, detail="Necesidad no encontrada")

    nec.satisfecha = satisfied
    session.add(nec)
    session.commit()
    return {"status": "success", "message": f"Necesidad marcada como {'satisfecha' if satisfied else 'pendiente'}"}


@router.delete("/api/v1/necesidades/{nec_id}")
def delete_necesidad(nec_id: str, session: Session = Depends(get_session)):
    nec = session.get(Necesidad, nec_id)
    if not nec:
        raise HTTPException(status_code=404, detail="Necesidad no encontrada")

    if not nec.satisfecha:
        raise HTTPException(
            status_code=400,
            detail="No se puede borrar una necesidad que no esté satisfecha. Márquela como satisfecha primero.",
        )

    relations = session.exec(select(VictimaNecesidad).where(VictimaNecesidad.necesidad_id == nec_id)).all()
    for rel in relations:
        session.delete(rel)
    session.flush()

    session.delete(nec)
    session.commit()
    return {"status": "success", "message": "Necesidad satisfecha eliminada del registro"}


@router.delete("/api/v1/victimas/{cedula}")
def delete_victima(cedula: str, session: Session = Depends(get_session)):
    v = session.get(Victima, cedula)
    if not v:
        raise HTTPException(status_code=404, detail="Víctima no encontrada")

    if v.status != "alta":
        raise HTTPException(
            status_code=400,
            detail="Solo se pueden dar de baja (eliminar) a las víctimas que estén en estado de 'alta'.",
        )

    needs_relations = session.exec(select(VictimaNecesidad).where(VictimaNecesidad.victima_cedula == cedula)).all()
    for rel in needs_relations:
        session.delete(rel)
    session.flush()

    needs_ids = [r.necesidad_id for r in needs_relations]
    for nid in needs_ids:
        nec = session.get(Necesidad, nid)
        if nec:
            session.delete(nec)

    contact_relations = session.exec(select(VictimaContacto).where(VictimaContacto.victima_cedula == cedula)).all()
    for rel in contact_relations:
        session.delete(rel)
    session.flush()

    contact_ids = [r.contacto_id for r in contact_relations]
    for cid in contact_ids:
        con = session.get(Contacto, cid)
        if con:
            session.delete(con)

    session.delete(v)
    session.commit()
    return {"status": "success", "message": "Víctima en estado de alta archivada exitosamente"}
