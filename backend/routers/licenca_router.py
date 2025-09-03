from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
import json
import base64
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.backends import default_backend
import os
from services.licenca_service import validar_licenca
from models.user_model import Empresa, User 
from sqlalchemy.orm import Session
from utils.db import get_db
router = APIRouter(prefix="/licenca", tags=["Licença"])

LICENCA_DIR = os.path.join(os.path.dirname(__file__), "../licencas")
LICENCA_PATH = os.path.join(LICENCA_DIR, "licenca.lic")

def carregar_chave_publica():
    try:
        caminho = os.path.join(os.path.dirname(__file__), "../public_key.pem")
        with open(caminho, "rb") as f:
            return serialization.load_pem_public_key(f.read(), backend=default_backend())
    except Exception as e:
        raise RuntimeError(f"Erro ao carregar chave pública: {str(e)}")

@router.post("/upload")
async def receber_licenca(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)  # 👈 injeta o banco
):
    if not file.filename.endswith(".lic"):
        raise HTTPException(status_code=400, detail="Formato inválido de arquivo")

    conteudo = await file.read()

    try:
        licenca_data = json.loads(conteudo.decode())
    except Exception:
        raise HTTPException(status_code=400, detail="Licença não é JSON válido")

    assinatura_b64 = licenca_data.pop("assinatura", None)
    if not assinatura_b64:
        raise HTTPException(status_code=400, detail="Licença não contém assinatura")

    try:
        assinatura = base64.b64decode(assinatura_b64)
        data_bytes = json.dumps(licenca_data, separators=(",", ":")).encode()
        chave_publica = carregar_chave_publica()

        chave_publica.verify(
            assinatura,
            data_bytes,
            padding.PKCS1v15(),
            hashes.SHA256()
        )

        # ✅ Atualizar a validade no banco
        empresa = db.query(Empresa).filter(Empresa.nif == licenca_data["nif"]).first()
        if not empresa:
            raise HTTPException(status_code=404, detail="Empresa não encontrada no sistema")

        empresa.validade_licenca = licenca_data["validade"]
        db.commit()

        # ✅ Criar pasta e salvar a licença
        os.makedirs(LICENCA_DIR, exist_ok=True)
        with open(LICENCA_PATH, "wb") as f:
            f.write(conteudo)

        return {
            "msg": "Licença válida ✅ e salva com sucesso.",
            "dados": licenca_data
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Assinatura inválida: {str(e)}")
@router.get("/status")
def verificar_licenca():
    try:
        if not os.path.exists(LICENCA_PATH):
            return {"valida": False, "motivo": "Arquivo de licença não encontrado"}

        # ✅ Usa a função que valida assinatura, data e máquina
        public_key_path = os.path.join(os.path.dirname(__file__), "../public_key.pem")
        with open(public_key_path, "r") as f:
            public_key_pem = f.read()

        licenca = validar_licenca(LICENCA_PATH, public_key_pem)

        return {"valida": True, "dados": licenca}

    except HTTPException as e:
        return {"valida": False, "motivo": e.detail}

    except Exception as e:
        return {"valida": False, "motivo": f"Erro inesperado: {str(e)}"}
