# Documentación Técnica — Medinsumos Venezuela

## Contexto del Proyecto

Plataforma web de emergencia desarrollada para centralizar, coordinar y gestionar la
recolección de información sobre damnificados por el terremoto de Venezuela del 24 de
junio de 2026. Su propósito es permitir la localización rápida de personas y administrar
el inventario de insumos médicos, medicamentos y componentes sanguíneos urgentes en
centros hospitalarios.

## Librerías Utilizadas

### Backend

| Librería  | Versión | Propósito |
|-----------|---------|-----------|
| FastAPI   | 0.139   | Framework web para construir la API REST |
| Uvicorn   | 0.49    | Servidor ASGI para correr FastAPI |
| SQLModel  | 0.39    | ORM basado en SQLAlchemy + Pydantic para modelos de BD |
| SQLAlchemy| 2.0     | Motor ORM subyacente (usado por SQLModel) |
| asyncpg   | 0.31    | Driver asíncrono para PostgreSQL |
| Alembic   | 1.18    | Sistema de migraciones de base de datos |
| Pydantic  | 2.13    | Validación de datos y serialización (modelos request/response) |
| python-dotenv | 1.2 | Carga de variables de entorno desde `.env` |
| Ruff      | 0.15    | Linter y formateador de código Python |

### Frontend

| Librería        | Propósito |
|-----------------|-----------|
| FontAwesome 6   | Iconos en la interfaz |
| Google Fonts (Outfit + Plus Jakarta Sans) | Tipografía del diseño |

No se utilizan frameworks JS ni CSS — todo es JavaScript y CSS vanilla.

## Arquitectura del Backend

Se utiliza una arquitectura modular dentro de la carpeta `app/`:

### Flujo de datos

```
Cliente (Frontend JS)
    ↓ HTTP (fetch API)
FastAPI Router (app/routers/)
    ↓ SQLModel ORM
PostgreSQL
    ↓ SQLAlchemy + asyncpg
```

### Capas

1. **Schemas** (`app/schemas/`): Modelos Pydantic para validar request/response
2. **Routers** (`app/routers/`): Endpoints de la API, usan `Depends(get_session)`
3. **Models** (`app/models/`): Clases SQLModel que mapean a tablas PostgreSQL
4. **Database** (`app/database/`): Configuración de engine, sesión y seed data

## Esquema de Base de Datos

### Tablas

```
estados (id, nombre)
ciudades (id, estado_id → estados.id, nombre)
hospitales (id, ciudad_id → ciudades.id, nombre)
victimas (cedula PK, nombre, apellidos, status, hospital_id → hospitales.id, fecha_de_registro)
necesidades (id, categoria, descripcion, satisfecha)
contactos (id, rol, numero_telefono, nombre_contacto)
victimas_necesidades (necesidad_id → necesidades.id, victima_cedula → victimas.cedula) PK compuesta
victimas_contactos (contacto_id → contactos.id, victima_cedula → victimas.cedula) PK compuesta
```

### Tipos ENUM (validados en backend, sin tipo ENUM nativo en PostgreSQL)

- **Status_Victima**: `estable | critico | alta | fallecido | desaparecido`
- **Categoria_Necesidad**: `medicamento | sangre | insumo`
- **Rol_Contacto**: `familiar | unidad_hospitalaria`

### Reglas de Integridad

- Las PKs de `victimas_necesidades` y `victimas_contactos` son compuestas (FK hacia necesidades/contactos + FK hacia victimas.cedula)
- El borrado en cascada se maneja desde la aplicación (no CASCADE en BD)

## Cómo se Usaron las Librerías

### FastAPI — Routers

```python
from fastapi import APIRouter, Depends, Query
from typing import Annotated

router = APIRouter(tags=["Ejemplo"])

@router.get("/api/v1/ejemplo")
def get_ejemplo(
    param: Annotated[str | None, Query(max_length=50)] = None,
    session: Session = Depends(get_session),
):
    ...
```

### SQLModel — Modelos

```python
from sqlmodel import Field, SQLModel

class Hospital(SQLModel, table=True):
    __tablename__ = "hospitales"
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    ciudad_id: str = Field(foreign_key="ciudades.id", nullable=False)
    nombre: str = Field(max_length=255, nullable=False)
```

### Alembic — Migraciones

```bash
# Generar migración automática
alembic revision --autogenerate -m "descripcion"

# Aplicar migraciones
alembic upgrade head

# Revertir
alembic downgrade -1
```

### Ruff — Linting

```bash
ruff check .                      # Verificar estilo
ruff check . --fix                # Corregir automáticamente
ruff format .                     # Formatear código
```

## Frontend

El frontend usa un sistema de **mock offline** (`frontend/js/mock-data.js`) que almacena
datos en `localStorage`. Esto permite desarrollo sin backend PostgreSQL activo.

Cuando el backend FastAPI está disponible, el frontend se conecta automáticamente a
`/api/v1/...` (rutas relativas). Si no hay conexión, usa `MockAPI` como fallback.

### Archivos Clave

- `frontend/index.html` — Estructura HTML con modales para registro
- `frontend/css/styles.css` — Diseño responsivo con modo claro/oscuro
- `frontend/js/app.js` — Lógica principal, renderizado, eventos
- `frontend/js/api.js` — Cliente HTTP con fallback a mock
- `frontend/js/mock-data.js` — Datos simulados en localStorage

## Migración de Prototipo Mock a Base de Datos Real

El proyecto inició como prototipo con `database_mock.py` (diccionarios en memoria).
La migración a PostgreSQL involucró:

1. Crear modelos SQLModel en `app/models/`
2. Configurar engine + sesión en `app/database/database.py`
3. Inicializar Alembic y generar migración inicial
4. Refactorizar endpoints de `main.py` a `app/routers/`
5. Usar `app.frontend()` en vez de `StaticFiles.mount()`
6. Mantener MockAPI en frontend para desarrollo offline

## Comandos Útiles

```bash
# Iniciar servidor de desarrollo
uvicorn main:app --reload --port 8000

# Migraciones
alembic revision --autogenerate -m "descripcion"
alembic upgrade head

# Seed (se ejecuta automáticamente al iniciar la app)
# python3 -c "from app.database.seed import seed; from app.database.database import engine; from sqlmodel import Session; seed(Session(engine))"

# Linting
ruff check .

# Ver tablas en PostgreSQL
psql -U postgres -d medinsumos -c "\dt"
```
