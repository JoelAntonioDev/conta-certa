# ✅ main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth_router
from utils.db import Base, engine
from routers import auth_router, licenca_router
from routers import auth_router, licenca_router, reconciliacao_fiscal_router
from routers import reconciliacao_contabil_router

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