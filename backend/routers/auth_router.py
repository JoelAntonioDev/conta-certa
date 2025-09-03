from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from utils.db import get_db
from models.user_model import Empresa, User
from schemas.auth_schema import EmpresaCreate, UserCreate, UserLogin
from services.auth_service import (
    criar_empresa,
    criar_usuario,
    autenticar_user
)
from utils.hardware_id import get_machine_id

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/empresa")
def criar_empresa_endpoint(empresa: EmpresaCreate, db: Session = Depends(get_db)):
    empresa = criar_empresa(db, empresa)
    return {"msg": f"Empresa {empresa.nome} criada com sucesso"}

@router.post("/register")
def criar_usuario_endpoint(user: UserCreate, db: Session = Depends(get_db)):
    user = criar_usuario(db, user)
    return {"msg": f"Usuário {user.username} criado com sucesso"}

@router.post("/login")
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = autenticar_user(db, login_data)
    return {"msg": f"Bem-vindo, {user.username}"}

@router.get("/empresa")
def empresa_existe(db: Session = Depends(get_db)):
    existe = db.query(Empresa).first() is not None
    return {"existe": existe}

@router.get("/usuarios")
def total_usuarios(db: Session = Depends(get_db)):
    total = db.query(User).count()
    return {"total": total}

@router.get("/empresa/detalhes")
def detalhes_empresa(db: Session = Depends(get_db)):
    empresa = db.query(Empresa).first()
    if not empresa:
        return {"erro": "Empresa não encontrada"}

    return {
        "nome": empresa.nome,
        "nif": empresa.nif,
        "validade_licenca": empresa.validade_licenca
    }
@router.get("/empresa/info-completa")
def empresa_info_completa(db: Session = Depends(get_db)):
    empresa = db.query(Empresa).first()
    if not empresa:
        return {"erro": "Empresa não encontrada"}

    return {
        "empresa": empresa.nome,
        "nif": empresa.nif,
        "validade": empresa.validade_licenca,
        "machine_id": get_machine_id(),
    }