# ✅ main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth_router
from utils.db import Base, engine
from routers import auth_router, licenca_router
from routers import auth_router, licenca_router, reconciliacao_fiscal_router
from routers import reconciliacao_contabil_router
from routers import relatorio_router
from routers import dashboard_router
from models import user_model
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

@app.get("/")
def root():
    return {"msg": "API ContaCerta rodando"}

app.include_router(auth_router.router)
app.include_router(licenca_router.router)
app.include_router(reconciliacao_fiscal_router.router)
app.include_router(reconciliacao_contabil_router.router)
app.include_router(relatorio_router.router)
app.include_router(dashboard_router.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=True
    )
