from sqlalchemy.orm import Session
from models.user_model import Empresa, User
from passlib.context import CryptContext
from fastapi import HTTPException

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def criar_empresa(db: Session, empresa_data):
    # ❗ Verifica se já existe qualquer empresa
    if db.query(Empresa).first():
        raise HTTPException(status_code=400, detail="Já existe uma empresa cadastrada")

    empresa = Empresa(**empresa_data.dict())
    db.add(empresa)
    db.commit()
    db.refresh(empresa)
    return empresa


def criar_usuario(db: Session, user_data):
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(status_code=400, detail="Usuário já existe")

    empresa = db.query(Empresa).first()
    if not empresa:
        raise HTTPException(status_code=404, detail="Nenhuma empresa cadastrada")


    # Verifica limite de 4 usuários
    if len(empresa.usuarios) >= 4:
        raise HTTPException(status_code=403, detail="Limite de usuários atingido para esta empresa")

    user = User(
        username=user_data.username,
        password=pwd_context.hash(user_data.password),
        empresa_id=empresa.id
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def autenticar_user(db: Session, login_data):
    user = db.query(User).filter(User.username == login_data.email).first()
    if not user or not pwd_context.verify(login_data.senha, user.password):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    return user