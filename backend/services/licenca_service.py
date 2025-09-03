import json
from datetime import date, datetime
import base64
import os
import requests
from fastapi import HTTPException
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.exceptions import InvalidSignature
from utils.hardware_id import get_machine_id

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LICENCAS_DIR = os.path.join(BASE_DIR, "../licencas")
ULTIMA_DATA_PATH = os.path.join(LICENCAS_DIR, "ultima_execucao.json")
PUBLIC_KEY_PATH = os.path.join(BASE_DIR, "../public_key.pem")


def carregar_chave_publica():
    with open(PUBLIC_KEY_PATH, "rb") as f:
        return serialization.load_pem_public_key(f.read())


def obter_data_atual_confiavel():
    try:
        res = requests.get("http://worldtimeapi.org/api/ip", timeout=(1, 2))
        if res.status_code == 200:
            data_str = res.json()["datetime"]
            print(f"[INFO] Data confiável recebida: {data_str}")
            return datetime.fromisoformat(data_str).date()
    except Exception as e:
        print(f"[INFO] Não foi possível obter data externa: {e}")
        return None


def verificar_data_local():
    if not os.path.exists(ULTIMA_DATA_PATH):
        raise HTTPException(
            status_code=403,
            detail="Não foi possível validar a data. Conecte-se à internet na primeira execução para gerar verificação local.",
        )

    with open(ULTIMA_DATA_PATH, "r") as f:
        data_json = json.load(f)

    ultima_data = date.fromisoformat(data_json["data"])
    hoje = date.today()

    if hoje < ultima_data:
        raise HTTPException(
            status_code=403,
            detail="A data do sistema foi retrocedida. Verificação da licença falhou.",
        )


def salvar_data_local(data: date):
    os.makedirs(LICENCAS_DIR, exist_ok=True)
    with open(ULTIMA_DATA_PATH, "w") as f:
        json.dump({"data": data.isoformat()}, f)


def validar_licenca(path: str, public_key_pem: str):
    try:
        with open(path, "r") as f:
            lic = json.load(f)

        dados_base = {
            "empresa": lic["empresa"],
            "nif": lic["nif"],
            "validade": lic["validade"],
            "machine_id": lic["machine_id"]
        }

        data_bytes = json.dumps(dados_base, separators=(",", ":")).encode()
        assinatura = base64.b64decode(lic["assinatura"])

        public_key = serialization.load_pem_public_key(public_key_pem.encode())
        public_key.verify(
            assinatura, data_bytes, padding.PKCS1v15(), hashes.SHA256()
        )

        validade = date.fromisoformat(lic["validade"])
        data_confiavel = obter_data_atual_confiavel()

        if data_confiavel:
            if validade < data_confiavel:
                raise HTTPException(status_code=403, detail="Licença expirada (data externa confiável)")
            salvar_data_local(data_confiavel)
        else:
            verificar_data_local()
            if validade < date.today():
                raise HTTPException(status_code=403, detail="Licença expirada (data local)")

        if lic["machine_id"] != get_machine_id():
            raise HTTPException(status_code=403, detail="Licença não corresponde a esta máquina")

        return lic

    except HTTPException:
        raise
    except InvalidSignature:
        raise HTTPException(status_code=403, detail="Assinatura da licença inválida")
    except Exception as e:
        raise HTTPException(status_code=403, detail=f"Licença inválida: {str(e)}")
