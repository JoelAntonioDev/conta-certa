from sqlalchemy.orm import Session
from models.user_model import MovimentacaoBAI
import camelot
import pandas as pd
from utils.db import SessionLocal
from models.user_model import MovimentacaoContabilidade
from datetime import datetime
from decimal import Decimal

def extrair_dados_bai(pdf_path: str) -> pd.DataFrame:
    tabelas = camelot.read_pdf(pdf_path, pages="all", flavor="stream")
    tabelas_validas = [t.df for t in tabelas if t.df.shape[1] == 6]

    if not tabelas_validas:
        return pd.DataFrame()

    df_final = pd.concat(tabelas_validas, ignore_index=True)
    df_final.columns = df_final.iloc[0]
    df_final = df_final.drop(index=0).reset_index(drop=True)
    print(df_final)
    if not df_final.empty:
        db = SessionLocal()
        salvar_movimentacoes(db, df_final)
        db.close()
        print("✅ Movimentações salvas com sucesso!")
    else:
        print("⚠ Nenhuma movimentação encontrada.")
    return df_final


def parse_valor(valor):
    if pd.isna(valor) or valor == "":
        return 0.0
    if isinstance(valor, (int, float)):
        return float(valor)
    # Remove espaços e trata milhar/decimal pt-BR
    s = str(valor).replace(" ", "").replace(".", "").replace(",", ".")
    try:
        return float(s)
    except:
        return 0.0

def extrair_dados_contabilidade(xls_path: str) -> pd.DataFrame:
    df = pd.read_excel(xls_path, header=5)

    # Rename colunas para nomes padrão
    colunas_mapeadas = {
        "DATA MOVIMENTO": "data_movimento",
        "N. OPERACAO": "numero_operacao",
        "DATA VALOR": "data_valor",
        "DESCRITIVO": "descritivo",
        "DEBITO Kz": "debito",
        "CREDITO Kz": "credito",
        "SALDO DISPONIVEL Kz": "saldo_disponivel"
    }
    df = df.rename(columns=colunas_mapeadas)

    # Limpar linhas totalmente vazias
    df = df.dropna(how="all")

    # Converter os valores monetários usando parse_valor
    df["debito"] = df["debito"].apply(parse_valor)
    df["credito"] = df["credito"].apply(parse_valor)
    df["saldo_disponivel"] = df["saldo_disponivel"].apply(parse_valor)

    print(df.head())  # Para debug

    # Salvar no banco
    salvar_movimentacoes_contabilidade(SessionLocal(), df)

    return df

def normalizar_data(valor):
    if not valor:
        return None
    for fmt in ("%d/%m/%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(valor.strip(), fmt).date()
        except ValueError:
            pass
    return None  # formato inválido

def normalizar_valor(valor):
    if valor is None:
        return Decimal("0.00")
    
    if isinstance(valor, (int, float, Decimal)):
        return Decimal(str(valor))
    
    # Limpa espaços e símbolos
    s = str(valor).strip().replace(" ", "").replace(".", "").replace(",", ".")
    
    # Remove qualquer coisa que não seja número, ponto ou sinal
    import re
    s = re.sub(r"[^0-9\.-]", "", s)
    
    if s in ("", "-", ".", "-."):
        return Decimal("0.00")
    
    try:
        return Decimal(s)
    except Exception:
        return Decimal("0.00")


def normalizar_texto(texto):
    return str(texto).strip().upper()  # upper() ajuda na conciliação textual

def salvar_movimentacoes(db: Session, df: pd.DataFrame):
    df.columns = df.columns.str.strip().str.lower()

    for _, row in df.iterrows():
        mov = MovimentacaoBAI(
            data_mov=normalizar_data(row.get("data mov.", "")),
            data_valor=normalizar_data(row.get("data valor", "")),
            descritivo=normalizar_texto(row.get("descritivo", "")),
            debito=normalizar_valor(row.get("débito", "")),
            credito=normalizar_valor(row.get("crédito", "")),
            saldo=normalizar_valor(row.get("movimento", ""))
        )
        db.add(mov)
    db.commit()

def salvar_movimentacoes_contabilidade(db: Session, df: pd.DataFrame):
    for _, row in df.iterrows():
        mov = MovimentacaoContabilidade(
            data_mov=normalizar_data(row.get("data_movimento", "")),
            data_valor=normalizar_data(row.get("data_valor", "")),
            numero_operacao=normalizar_texto(row.get("numero_operacao", "")),
            descritivo=normalizar_texto(row.get("descritivo", "")),
            debito=normalizar_valor(row.get("debito", 0.0)),
            credito=normalizar_valor(row.get("credito", 0.0)),
            saldo=normalizar_valor(row.get("saldo_disponivel", 0.0))
        )
        db.add(mov)
    db.commit()
    print("✅ Movimentações salvas com sucesso!")