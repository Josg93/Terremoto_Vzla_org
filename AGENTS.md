## nombre de proyecto: Medinsumos Venezuela
Aplicación de asistencia para los afectados del terremoto de Venezuela el 24 de junio de 2026. Donde se muestren donde estan los pacientes afectados, que insumos necesitan, donantes de sangre, organos, etc.

## Stack
- FastAPI para el backend
- PostgreSQL para la base de datos
- HTML, CSS y JavaScript vanilla para el frontend web

## Estructura de carpetas
### carpeta base:
 - app/
   - database/   (base.py, database.py, seed.py)
   - models/     (modelos ORM con SQLModel)
   - routers/    (endpoints de la API)
   - schemas/    (Pydantic request/response models)
 - docs/         (documentación del proyecto)
 - frontend/     (HTML, CSS, JS)
   - css/
   - js/
   - index.html
 - spec/         (constitución y especificaciones)
 - main.py       (entrypoint de FastAPI)
 - Alembic/      (migraciones de base de datos)
 - pyproject.toml
 - AGENTS.md

## Convenciones
  - Sigue los principios de la constitución en spec/constitucion/
  - Siempre verifica las skills instaladas en .opencode/.agents/skills
  - Ejecuta Ruff antes de commits: `ruff check .`
  - Usa SQLModel para modelos de base de datos
  - Usa `app.frontend()` para servir el frontend
  - Prefiere `Annotated[..., Query()]` para query parameters

## Prohibiciones:
  - POR NINGUN MOTIVO SUBAS EL .env AL GITHUB 
