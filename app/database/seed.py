import uuid
from datetime import datetime

from sqlmodel import Session

from app.models import Ciudad, Contacto, Estado, Hospital, Necesidad, Victima, VictimaContacto, VictimaNecesidad


def seed_database(session: Session):
    estados_existentes = session.query(Estado).count()
    if estados_existentes > 0:
        return

    e_la_guaira = Estado(id=str(uuid.uuid4()), nombre="La Guaira")
    e_distrito = Estado(id=str(uuid.uuid4()), nombre="Distrito Capital")
    e_miranda = Estado(id=str(uuid.uuid4()), nombre="Miranda")
    session.add_all([e_la_guaira, e_distrito, e_miranda])
    session.flush()

    ciudades_data = [
        ("Maiquetía", e_la_guaira.id),
        ("La Guaira", e_la_guaira.id),
        ("Macuto", e_la_guaira.id),
        ("Caraballeda", e_la_guaira.id),
        ("Naiguatá", e_la_guaira.id),
        ("Caracas", e_distrito.id),
        ("Los Teques", e_miranda.id),
    ]
    ciudades = {}
    for nombre, est_id in ciudades_data:
        c = Ciudad(id=str(uuid.uuid4()), estado_id=est_id, nombre=nombre)
        ciudades[nombre] = c
    session.add_all(ciudades.values())
    session.flush()

    hospitales_data = [
        ("Hospital Dr. Rafael Medina Jiménez (Pariata)", ciudades["Maiquetía"].id),
        ("Hospital José María Vargas de La Guaira", ciudades["La Guaira"].id),
        ("Materno Infantil de Macuto (Ana Teresa de Jesús)", ciudades["Macuto"].id),
        ("Hospital de Niños J.M. de los Ríos", ciudades["Caracas"].id),
        ("Hospital Universitario de Caracas (HUC)", ciudades["Caracas"].id),
    ]
    hospitales = {}
    for nombre, ciu_id in hospitales_data:
        h = Hospital(id=str(uuid.uuid4()), ciudad_id=ciu_id, nombre=nombre)
        hospitales[nombre] = h
    session.add_all(hospitales.values())
    session.flush()

    victimas_data = [
        {
            "cedula": "12345678",
            "nombre": "Carlos",
            "apellidos": "Rodríguez",
            "status": "critico",
            "hospital": hospitales["Hospital Dr. Rafael Medina Jiménez (Pariata)"],
            "necesidades": [
                Necesidad(
                    id=str(uuid.uuid4()),
                    categoria="medicamento",
                    descripcion="Albúmina humana al 20%, 5 frascos",
                    satisfecha=False,
                ),
                Necesidad(
                    id=str(uuid.uuid4()),
                    categoria="insumo",
                    descripcion="Catéter venoso central de 7 Fr triple luz",
                    satisfecha=False,
                ),
            ],
            "contactos": [
                Contacto(
                    id=str(uuid.uuid4()),
                    rol="familiar",
                    numero_telefono="+584121112233",
                    nombre_contacto="María Rodríguez (Madre)",
                ),
            ],
        },
        {
            "cedula": "23456789",
            "nombre": "Carmen",
            "apellidos": "Gómez",
            "status": "estable",
            "hospital": hospitales["Hospital José María Vargas de La Guaira"],
            "necesidades": [
                Necesidad(
                    id=str(uuid.uuid4()),
                    categoria="sangre",
                    descripcion="3 donantes de sangre O Negativo",
                    satisfecha=False,
                ),
            ],
            "contactos": [
                Contacto(
                    id=str(uuid.uuid4()),
                    rol="familiar",
                    numero_telefono="+584249998877",
                    nombre_contacto="Juan Gómez (Hermano)",
                ),
            ],
        },
        {
            "cedula": "15987456",
            "nombre": "Jesús",
            "apellidos": "Pérez",
            "status": "critico",
            "hospital": hospitales["Hospital de Niños J.M. de los Ríos"],
            "necesidades": [
                Necesidad(
                    id=str(uuid.uuid4()),
                    categoria="medicamento",
                    descripcion="Meropenem 1g (ampollas), 14 unidades",
                    satisfecha=False,
                ),
                Necesidad(
                    id=str(uuid.uuid4()),
                    categoria="insumo",
                    descripcion="Jeringas de 10cc y 20cc, 30 unidades cada una",
                    satisfecha=True,
                ),
            ],
            "contactos": [
                Contacto(
                    id=str(uuid.uuid4()),
                    rol="unidad_hospitalaria",
                    numero_telefono="+584143332211",
                    nombre_contacto="Enfermera Jefa Piso 3 (JM)",
                ),
            ],
        },
    ]

    for vd in victimas_data:
        v = Victima(
            cedula=vd["cedula"],
            nombre=vd["nombre"],
            apellidos=vd["apellidos"],
            status=vd["status"],
            hospital_id=vd["hospital"].id,
            fecha_de_registro=datetime.now(),
        )
        session.add(v)
        session.flush()

        for nec in vd["necesidades"]:
            session.add(nec)
            session.flush()
            session.add(VictimaNecesidad(necesidad_id=nec.id, victima_cedula=v.cedula))

        for con in vd["contactos"]:
            session.add(con)
            session.flush()
            session.add(VictimaContacto(contacto_id=con.id, victima_cedula=v.cedula))

    session.commit()
