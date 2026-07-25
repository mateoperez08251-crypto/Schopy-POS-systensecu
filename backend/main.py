from fastapi import FastAPI
from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

@app.get("/")
def root():
    return {"message": "Welcome to Smart POS API with AI Auditing"}

# Rutas y websockets se incluirán aquí...
