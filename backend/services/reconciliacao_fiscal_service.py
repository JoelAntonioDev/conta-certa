import os
import uuid
from fastapi import UploadFile
from sqlalchemy.orm import Session
from models.user_model import ReconciliacaoFiscal
import shutil
import pandas as pd
from fastapi.encoders import jsonable_encoder
import unicodedata

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "../uploads/fiscal")

async def salvar_ficheiro(ficheiro: UploadFile, tipo: str) -> str:
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    filename = f"{tipo}_{uuid.uuid4().hex}_{ficheiro.filename}"
    full_path = os.path.join(UPLOAD_DIR, filename)

    with open(full_path, "wb") as f:
        content = await ficheiro.read()
        f.write(content)

    # Caminho relativo com barras normalizadas
    relative_path = os.path.relpath(full_path, start=os.getcwd()).replace("\\", "/")
    return relative_path


async def processar_ficheiros(
    fornecedores: UploadFile,
    retencao: UploadFile,
    db: Session,
    empresa_id: int,
    periodo: str = "2025-01"  # opcional, você pode tornar isso dinâmico
):
    path_forn = await salvar_ficheiro(fornecedores, "fornecedores")
    path_ret = await salvar_ficheiro(retencao, "retencao")

    nova_reconciliacao = ReconciliacaoFiscal(
        periodo=periodo,
        fornecedores_path=path_forn,
        retencao_path=path_ret,
        empresa_id=empresa_id,
    )

    db.add(nova_reconciliacao)
    db.commit()
    db.refresh(nova_reconciliacao)

    return {
        "id": nova_reconciliacao.id,
        "periodo": nova_reconciliacao.periodo,
        "fornecedores_path": path_forn,
        "retencao_path": path_ret,
        "criado_em": nova_reconciliacao.criado_em,
    }

def limpar_nome(nome):
    if pd.isna(nome):
        return ""
    nome = str(nome).upper().strip()
    nome = unicodedata.normalize('NFKD', nome)
    nome = ''.join([c for c in nome if not unicodedata.combining(c)])
    nome = nome.replace("-", " ").replace(",", "").replace(".", "")
    nome = " ".join(nome.split())  # remove espaços duplicados
    return nome


def reconciliar_fiscal(path_agt, path_fornecedores):
    try:
        abs_agt = os.path.join(os.getcwd(), path_agt)
        abs_forn = os.path.join(os.getcwd(), path_fornecedores)

        print(f"📄 Caminho Mapa AGT: {abs_agt}")
        print(f"📄 Caminho Mapa Fornecedores: {abs_forn}")

        agt_df = pd.read_excel(abs_agt, skiprows=2)
        cont_df = pd.read_excel(abs_forn, skiprows=1)

        print("🧾 AGT columns:", list(agt_df.columns))
        print("🧾 Fornecedores columns:", list(cont_df.columns))

        agt_df.columns = agt_df.columns.str.strip().str.replace(r"\s+", " ", regex=True)
        cont_df.columns = cont_df.columns.str.strip().str.replace(r"\s+", " ", regex=True)

        agt_df = agt_df.rename(columns={
            "Nº de Identificação Fiscal": "nif",
            "Nº do Documento": "numero_documento",
            "Valor do Documento": "valor_documento",
            "IVA Dedutível - Valor": "iva_dedutivel"
        })

        cont_df = cont_df.rename(columns={
            "NIF": "nif",
            "NÚMERO DO DOCUMENTO": "numero_documento",
            "VALOR DO DOCUMENTO": "valor_documento",
            "IVA DEDUTÍVEL VALOR": "iva_dedutivel"
        })

        def normalizar(df, origem):
            df["nif"] = df["nif"].astype(str).str.strip()
            df["numero_documento"] = df["numero_documento"].astype(str).str.strip().str.upper()
            df["valor_documento"] = pd.to_numeric(df["valor_documento"], errors="coerce").round(2)
            df["iva_dedutivel"] = pd.to_numeric(df["iva_dedutivel"], errors="coerce").round(2)

            if origem == "agt":
                nome_col = "Nome / Firma"
            else:
                nome_col = "NOME / DENOMINAÇÃO"

            if nome_col in df.columns:
                df["nome_normalizado"] = df[nome_col].apply(limpar_nome)
            else:
                df["nome_normalizado"] = ""

            return df


        agt_df = normalizar(agt_df, origem="agt")
        cont_df = normalizar(cont_df, origem="cont")


        print("🔍 AGT Columns Normalized:", list(agt_df.columns))
        print("🔍 Fornecedores Columns Normalized:", list(cont_df.columns))

        # Conciliados: registros totalmente iguais
        conciliados = pd.merge(
            agt_df,
            cont_df,
            on=["nif", "numero_documento", "valor_documento", "iva_dedutivel"],
            how="inner"
        )

        # Divergência no IVA: mesmo NIF, nº doc, valor doc — IVA diferente
        merged_all = pd.merge(
            agt_df,
            cont_df,
            on=["nif", "numero_documento", "valor_documento"],
            how="inner",
            suffixes=('_agt', '_cont')
        )
        divergentes_iva = merged_all[merged_all["iva_dedutivel_agt"] != merged_all["iva_dedutivel_cont"]]

        # Só no AGT (apenas documentos do AGT que não estão 100% no contabilidade)
        so_agt = agt_df.merge(
            cont_df,
            on=["nif", "numero_documento", "valor_documento", "iva_dedutivel"],
            how="left",
            indicator=True
        )
        so_agt = so_agt[so_agt["_merge"] == "left_only"].drop(columns=["_merge"])

        # Só na contabilidade
        so_cont = cont_df.merge(
            agt_df,
            on=["nif", "numero_documento", "valor_documento", "iva_dedutivel"],
            how="left",
            indicator=True
        )
        so_cont = so_cont[so_cont["_merge"] == "left_only"].drop(columns=["_merge"])

        print(f"✅ Conciliados: {len(conciliados)}")
        print(f"⚠️ Divergentes no IVA: {len(divergentes_iva)}")
        print(f"📄 Só no mapa AGT: {len(so_agt)}")
        print(f"📄 Só na contabilidade: {len(so_cont)}")

        return jsonable_encoder({
            "conciliados": conciliados.where(pd.notnull(conciliados), None).to_dict(orient="records"),
            "divergentes_iva": divergentes_iva.where(pd.notnull(divergentes_iva), None).to_dict(orient="records"),
            "so_agt": so_agt.where(pd.notnull(so_agt), None).to_dict(orient="records"),
            "so_contabilidade": so_cont.where(pd.notnull(so_cont), None).to_dict(orient="records")
        }, custom_encoder={float: lambda x: None if pd.isna(x) else x})

    except Exception as e:
        print("❌ Erro durante a reconciliação:", str(e))
        raise e
