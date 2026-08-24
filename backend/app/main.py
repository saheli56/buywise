from fastapi import FastAPI
from app.api.routes import router

app = FastAPI(title="Buywise API")

app.include_router(router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"message": "Buywise API is running"}
