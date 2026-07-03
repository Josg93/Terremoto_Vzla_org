import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlmodel import Session

from app.database.database import engine
from app.database.seed import seed_database
from app.routers.ubicacion import router as ubicacion_router
from app.routers.victimas import router as victimas_router

app = FastAPI(
    title="Medinsumos Venezuela API",
    description="API para gestionar la recolección de información sobre personas necesitadas de insumos médicos en hospitales de Venezuela.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ubicacion_router)
app.include_router(victimas_router)


@app.on_event("startup")
def on_startup():
    try:
        with Session(engine) as session:
            seed_database(session)
    except Exception as e:
        print(f"[INFO] Base de datos no disponible para seed: {e}")


frontend_path = os.path.join(os.path.dirname(__file__), "frontend")
if os.path.exists(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")
else:

    @app.get("/")
    def read_root():
        return {"status": "API running", "message": "Frontend not found"}

