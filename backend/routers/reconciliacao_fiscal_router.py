from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from services.reconciliacao_fiscal_service import processar_ficheiros, reconciliar_fiscal
from utils.db import get_db
from sqlalchemy.orm import Session
import os

router = APIRouter(prefix="/fiscal", tags=["Reconciliação Fiscal"])

@router.post("/upload")
async def upload_ficheiros(
    fornecedores: UploadFile = File(...),
    retencao: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    try:
        # Substituir por empresa do token futuramente
        empresa_id = 1
        resultado = await processar_ficheiros(fornecedores, retencao, db, empresa_id)
        return {"msg": "Ficheiros processados com sucesso", "dados": resultado}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro no processamento: {str(e)}")


@router.post("/reconciliar")
def reconciliar(
    empresa_id: int = 1,  # Simulado, depois virá do token
    periodo: str = "2025-01",  # Futuramente dinâmico
    db: Session = Depends(get_db),
):
    from models.user_model import ReconciliacaoFiscal

    reconciliacao = (
        db.query(ReconciliacaoFiscal)
        .filter_by(empresa_id=empresa_id, periodo=periodo)
        .order_by(ReconciliacaoFiscal.criado_em.desc())
        .first()
    )

    if not reconciliacao:
        raise HTTPException(status_code=404, detail="Ficheiros não encontrados para reconciliação")

    path_agt = os.path.abspath(reconciliacao.retencao_path)
    path_fornecedores = os.path.abspath(reconciliacao.fornecedores_path)

    if not os.path.exists(path_agt) or not os.path.exists(path_fornecedores):
        raise HTTPException(status_code=400, detail="Caminhos dos ficheiros inválidos")

    try:
        resultado = reconciliar_fiscal(path_agt, path_fornecedores)
        return {"msg": "Reconciliação concluída", "dados": resultado}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao reconciliar: {str(e)}")
