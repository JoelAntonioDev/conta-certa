from pydantic import BaseModel

class EmpresaCreate(BaseModel):
    nome: str
    nif: str
    validade_licenca: str  # pode usar date com parse automático

class UserCreate(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    email: str
    senha: str
