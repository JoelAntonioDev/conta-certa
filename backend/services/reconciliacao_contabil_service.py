import os
import shutil
from fastapi import UploadFile
from sqlalchemy.orm import Session
from utils.extratores import  extrair_dados_bai 
from utils.extratores import extrair_dados_contabilidade
import pandas as pd
from difflib import SequenceMatcher
from models.user_model import MovimentacaoBAI, MovimentacaoContabilidade
from datetime import datetime
from models.user_model import ExecucaoReconciliacao
from utils.relatorios import gerar_pdf_conciliacao, gerar_excel_conciliacao
from utils.conciliacao import conciliar_movimentos_db

async def salvar_arquivo(upload: UploadFile, destino: str):
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    with open(destino, "wb") as f:
        shutil.copyfileobj(upload.file, f)
    return destino


async def processar_contabil(
    banco: str,
    modelo: str,
    extrato_file: UploadFile,
    contabilidade_file: UploadFile,
    db: Session,
    empresa_id: int
):
    try:
        extrato_path = f"uploads/contabil/{empresa_id}_extrato.{extrato_file.filename.split('.')[-1]}"
        contab_path = f"uploads/contabil/{empresa_id}_contabilidade.{contabilidade_file.filename.split('.')[-1]}"

        await salvar_arquivo(extrato_file, extrato_path)
        await salvar_arquivo(contabilidade_file, contab_path)
        print("salvou e não extraiu")

        # Extrair dados
        if banco == "bfa":
            dados_extrato = None
        elif banco == "bai":
            dados_extrato = extrair_dados_bai(extrato_path)
        else:
            raise ValueError("Banco não suportado")

        print("extraiu extrato")

        if dados_extrato is not None:
            palavras_ignoradas = {"SALDO INICIAL", "SALDO FINAL", "TRANSPORTE", "A TRANSPORTAR"}
            def linha_valida_df(row) -> bool:
                valores = " ".join(str(v).upper() for v in row if v is not None)
                return not any(p in valores for p in palavras_ignoradas)
            dados_extrato = dados_extrato[dados_extrato.apply(linha_valida_df, axis=1)]

        dados_contabilidade = extrair_dados_contabilidade(contab_path)
        print("extraiu contabilidade")

        # Criar execução
        execucao = ExecucaoReconciliacao(empresa_id=empresa_id)
        db.add(execucao)
        db.commit()
        db.refresh(execucao)

        # Salvar movimentos
        salvar_movimentacoes_extrato(db, dados_extrato, empresa_id, execucao.id)
        salvar_movimentacoes_contabilidade(db, dados_contabilidade, empresa_id, execucao.id)

        # JSON serializável
        extrato_json = dados_extrato.fillna("").to_dict(orient="records") if dados_extrato is not None else []
        contabilidade_json = dados_contabilidade.fillna("").to_dict(orient="records") if dados_contabilidade is not None else []

        conciliacao = conciliar_movimentos_db(db, execucao.id)

        summary = {
            "total_extrato": len(extrato_json),
            "total_contabilidade": len(contabilidade_json),
            "conciliados": len(conciliacao.get("conciliados", [])),
            "somente_extrato": len(conciliacao.get("somente_extrato", [])),
            "somente_contabilidade": len(conciliacao.get("somente_contabilidade", [])),
        }

        resultado = {
            "extrato": extrato_json,
            "contabilidade": contabilidade_json,
            "conciliacao": conciliacao,
            "summary": summary
        }

        # 🔹 Geração automática dos relatórios
        pasta = "uploads/relatorios"
        os.makedirs(pasta, exist_ok=True)
        caminho_pdf = os.path.join(pasta, f"relatorio_{execucao.id}.pdf")
        caminho_excel = os.path.join(pasta, f"relatorio_{execucao.id}.xlsx")

        gerar_pdf_conciliacao(db, execucao.id, caminho_pdf)
        gerar_excel_conciliacao(db, execucao.id, caminho_excel)

        return resultado

    except Exception as e:
        import traceback
        print("Erro em processar_contabil:", e)
        traceback.print_exc()


def salvar_movimentacoes_extrato(db: Session, df: pd.DataFrame, empresa_id: int, execucao_id: int):
    """Salva no banco os movimentos do extrato ligados a uma execução específica."""
    for _, row in df.iterrows():
        mov = MovimentacaoBAI(
            empresa_id=empresa_id,
            execucao_id=execucao_id,
            data_mov=row.get("data mov.") or row.get("data_mov"),
            data_valor=row.get("data valor") or row.get("data_valor"),
            descritivo=row.get("descritivo"),
            debito=_parse_float(row.get("débito") or row.get("debito")),
            credito=_parse_float(row.get("crédito") or row.get("credito")),
            saldo=_parse_float(row.get("movimento") or row.get("saldo_disponivel")),
        )
        db.add(mov)
    db.commit()

def salvar_movimentacoes_contabilidade(db: Session, df: pd.DataFrame, empresa_id: int, execucao_id: int):
    """Salva no banco os movimentos da contabilidade ligados a uma execução específica."""
    for _, row in df.iterrows():
        mov = MovimentacaoContabilidade(
            empresa_id=empresa_id,
            execucao_id=execucao_id,
            data_mov=row.get("data_movimento"),
            data_valor=row.get("data_valor"),
            numero_operacao=str(row.get("numero_operacao")),
            descritivo=row.get("descritivo"),
            debito=_parse_float(row.get("debito")),
            credito=_parse_float(row.get("credito")),
            saldo=_parse_float(row.get("saldo_disponivel")),
        )
        db.add(mov)
    db.commit()

def _parse_float(value):
    """Converte valores em float de forma segura."""
    if value in (None, "", "NaN"):
        return 0.0
    try:
        return float(str(value).replace(",", ".").replace(" ", ""))
    except:
        return 0.0
