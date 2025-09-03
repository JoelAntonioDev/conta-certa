from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Form
from sqlalchemy.orm import Session
from services.reconciliacao_contabil_service import processar_contabil
from utils.db import get_db

router = APIRouter(prefix="/contabil", tags=["Reconciliação Contábil"])

@router.post("/upload")
async def upload_ficheiros_contabeis(
    banco: str = Form(...),
    modelo: str = Form(...),
    extrato: UploadFile = File(...),
    contabilidade: UploadFile = File(...),
    db: Session = Depends(get_db)
):
   
    try:
        empresa_id = 3  # ← virá do token futuramente
        resultado = await processar_contabil(
            banco=banco,
            modelo=modelo,
            extrato_file=extrato,
            contabilidade_file=contabilidade,
            db=db,
            empresa_id=empresa_id,
        )
        print("Chegou aqui")
        return {"msg": "Ficheiros processados com sucesso", "dados": resultado}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro no processamento: {str(e)}")
