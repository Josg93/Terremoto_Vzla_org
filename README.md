# Medinsumos Venezuela

Plataforma de asistencia para los afectados del terremoto de Venezuela (24 de junio de 2026).
Permite visualizar pacientes registrados en hospitales y sus necesidades para que ONGs y personas puedan donar.

## Stack Tecnológico

| Capa      | Tecnología                          |
|-----------|-------------------------------------|
| Backend   | FastAPI 0.139 + Python 3.10        |
| ORM       | SQLModel 0.39 (SQLAlchemy 2.0)     |
| DB        | PostgreSQL + asyncpg                |
| Migraciones | Alembic                           |
| Frontend  | HTML + CSS + JavaScript vanilla     |
| Linting   | Ruff                                |

## Estructura del Proyecto

```
├── app/
│   ├── __init__.py
│   ├── database/        # Configuración de BD, sesiones, seed
│   │   ├── base.py      # SQLModel Base + Enums
│   │   ├── database.py  # Engine y get_session
│   │   └── seed.py      # Datos iniciales
│   ├── models/          # Modelos ORM (SQLModel)
│   │   ├── estado.py, ciudad.py, hospital.py
│   │   ├── victima.py, necesidad.py, contacto.py
│   │   └── victima_necesidad.py, victima_contacto.py
│   ├── routers/         # Endpoints de la API
│   │   ├── ubicacion.py # Estados, Ciudades, Hospitales
│   │   └── victimas.py  # CRUD Víctimas, Necesidades, Contactos
│   └── schemas/         # Pydantic models
│       ├── ubicacion.py, hospital.py, victima.py
├── alembic/             # Migraciones de base de datos
├── frontend/            # HTML, CSS, JS
├── spec/                # Constitución y especificaciones
├── main.py              # Entrypoint de FastAPI
├── pyproject.toml       # Dependencias y configuración
├── AGENTS.md            # Guía para el agente de IA
└── .env                 # Variables de entorno (NO SUBIR)
```

## Instalación

```bash
# Clonar y entrar
git clone <repo> && cd TerremotoVzla

# Instalar dependencias
pip install fastapi uvicorn sqlmodel asyncpg alembic python-dotenv pydantic ruff

# Configurar BD (PostgreSQL debe estar corriendo)
createdb medinsumos

# Configurar .env
echo "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/medinsumos" > .env

# Ejecutar migraciones
alembic upgrade head

# Iniciar servidor
uvicorn main:app --reload --port 8000
```

## Endpoints de la API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/estados` | Lista estados |
| GET | `/api/v1/ciudades?estado_id=` | Lista ciudades (filtro opcional) |
| GET | `/api/v1/hospitales?estado_id=&ciudad_id=` | Lista hospitales con ciudad y estado |
| POST | `/api/v1/hospitales` | Crear hospital |
| GET | `/api/v1/victimas?search=&status=&estado_id=&hospital_id=&categoria_necesidad=` | Lista víctimas con filtros |
| POST | `/api/v1/victimas` | Registrar víctima con necesidades y contactos |
| PUT | `/api/v1/victimas/{cedula}` | Actualizar datos de víctima |
| PUT | `/api/v1/necesidades/{id}?satisfied=true` | Marcar necesidad como satisfecha |
| DELETE | `/api/v1/necesidades/{id}` | Eliminar necesidad (solo si está satisfecha) |
| DELETE | `/api/v1/victimas/{cedula}` | Eliminar víctima (solo si está en "alta") |

## Rules de Negocio

- Cédula: 8 dígitos numéricos, sin puntos ni guiones
- Status: `estable | critico | alta | fallecido | desaparecido`
- Categoría necesidad: `medicamento | sangre | insumo`
- Rol contacto: `familiar | unidad_hospitalaria`
- DELETE necesidad: solo si `satisfecha = true`
- DELETE víctima: solo si `status = "alta"` (borra en cascada necesidades y contactos)

## Convenciones

- Usar `ruff check .` antes de commits
- Modelos con SQLModel, tablas en plural
- Query params con `Annotated[..., Query()]`
- Frontend servido vía `app.frontend()`
