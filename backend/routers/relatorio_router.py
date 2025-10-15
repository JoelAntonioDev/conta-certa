from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import os
from datetime import datetime
from utils.db import get_db
from utils.relatorios import gerar_pdf_conciliacao, gerar_excel_conciliacao
from models.user_model import ExecucaoReconciliacao

router = APIRouter(prefix="/relatorios", tags=["Relatórios"])

@router.get("/{execucao_id}/pdf")
def download_pdf(execucao_id: int):
    caminho = f"uploads/relatorios/relatorio_{execucao_id}.pdf"
    if not os.path.exists(caminho):
        raise HTTPException(status_code=404, detail="Relatório PDF não encontrado")
    return FileResponse(caminho, media_type="application/pdf", filename=f"relatorio_{execucao_id}.pdf")

@router.get("/{execucao_id}/excel")
def download_excel(execucao_id: int):
    caminho = f"uploads/relatorios/relatorio_{execucao_id}.xlsx"
    if not os.path.exists(caminho):
        raise HTTPException(status_code=404, detail="Relatório Excel não encontrado")
    return FileResponse(caminho, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", filename=f"relatorio_{execucao_id}.xlsx")

@router.get("/execucoes")
def listar_execucoes(db: Session = Depends(get_db)):
    execucoes = db.query(ExecucaoReconciliacao).all()
    return [
        {
            "id": e.id,
            "empresa_id": e.empresa_id,
            "criado_em": e.criado_em,
        }
        for e in execucoes
    ]
