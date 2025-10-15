from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from utils.db import get_db
from models.user_model import Empresa, ExecucaoReconciliacao, MovimentacaoBAI, MovimentacaoContabilidade

router = APIRouter()

@router.get("/dashboard")
def get_dashboard(db: Session = Depends(get_db)):
    # 🔹 Buscar a primeira empresa (mais tarde, pegar do user logado)
    empresa = db.query(Empresa).first()
    if not empresa:
        return {
            "empresa": {
                "id": None,
                "nome": "",
                "nif": "",
                "validade_licenca": ""
            },
            "execucoes": {
                "total": 0,
                "ultima_execucao": None,
                "status": None
            },
            "movimentacoes": {
                "total_extrato": 0,
                "total_contabilidade": 0,
                "nao_conciliados": 0
            }
        }

    # 🔹 Execuções
    execucoes = db.query(ExecucaoReconciliacao).filter_by(empresa_id=empresa.id).order_by(ExecucaoReconciliacao.criado_em.desc()).all()
    total_execucoes = len(execucoes)
    ultima_execucao = execucoes[0] if execucoes else None

    # 🔹 Movimentações
    total_extrato = db.query(MovimentacaoBAI).filter_by(empresa_id=empresa.id).count()
    total_contab = db.query(MovimentacaoContabilidade).filter_by(empresa_id=empresa.id).count()
    nao_conciliados = abs(total_extrato - total_contab)  # simplificado (podes refinar com conciliação real)

    return {
        "empresa": {
            "id": empresa.id,
            "nome": empresa.nome,
            "nif": empresa.nif,
            "validade_licenca": empresa.validade_licenca
        },
        "execucoes": {
            "total": total_execucoes,
            "ultima_execucao": ultima_execucao.criado_em if ultima_execucao else None,
            "status": ultima_execucao.status if ultima_execucao else None
        },
        "movimentacoes": {
            "total_extrato": total_extrato,
            "total_contabilidade": total_contab,
            "nao_conciliados": nao_conciliados
        }
    }
