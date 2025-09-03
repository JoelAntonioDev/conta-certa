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

async def salvar_arquivo(upload: UploadFile, destino: str):
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    with open(destino, "wb") as f:
        shutil.copyfileobj(upload.file, f)
    return destino

async def processar_contabil(banco: str, modelo: str, extrato_file: UploadFile, contabilidade_file: UploadFile, db: Session, empresa_id: int):
    try:
        extrato_path = f"uploads/contabil/{empresa_id}_extrato.{extrato_file.filename.split('.')[-1]}"
        contab_path = f"uploads/contabil/{empresa_id}_contabilidade.{contabilidade_file.filename.split('.')[-1]}"

        await salvar_arquivo(extrato_file, extrato_path)
        await salvar_arquivo(contabilidade_file, contab_path)
        print("salvou e não extraiu")

        if banco == "bfa":
            dados_extrato = None  # ajustar conforme necessidade
        elif banco == "bai":
            dados_extrato = extrair_dados_bai(extrato_path)
        else:
            raise ValueError("Banco não suportado")

        print("extraiu extrato")

        dados_contabilidade = extrair_dados_contabilidade(contab_path)
        print("extraiu contabilidade")

        # Convertendo para JSON serializável
        extrato_json = dados_extrato.fillna("").to_dict(orient="records") if dados_extrato is not None else []
        contabilidade_json = dados_contabilidade.fillna("").to_dict(orient="records") if dados_contabilidade is not None else []

        conciliacao = conciliar_movimentos_db(db, 3)

        return {
            "extrato": extrato_json,
            "contabilidade": contabilidade_json,
            "conciliacao": conciliacao
        }
    except Exception as e:
        import traceback
        print("Erro em processar_contabil:", e)
        traceback.print_exc()

def conciliar_movimentos_db(db: Session, valor_tolerancia: float = 0.01, descricao_sim_threshold: float = 0.6):
    extrato = db.query(MovimentacaoBAI).all()
    contab = db.query(MovimentacaoContabilidade).all()

    def format_data(d):
        if not d:
            return None
        if isinstance(d, datetime):
            return d.strftime('%Y-%m-%d')
        for fmt in ('%Y-%m-%d', '%d/%m/%Y'):
            try:
                return datetime.strptime(d, fmt).strftime('%Y-%m-%d')
            except:
                pass
        return d

    def to_dict_list(registros):
        return [{
            'id': r.id,
            'data_mov': format_data(r.data_mov),
            'data_valor': format_data(r.data_valor),
            'descritivo': (r.descritivo or "").upper().strip(),
            'debito': float(r.debito or 0),
            'credito': float(r.credito or 0),
            'saldo': float(r.saldo or 0)
        } for r in registros]

    extrato_list = to_dict_list(extrato)
    contab_list = to_dict_list(contab)

    for r in extrato_list:
        r['valor_liq'] = r['credito'] - r['debito']
    for r in contab_list:
        r['valor_liq'] = r['credito'] - r['debito']

    usados_contab = set()
    conciliados = []

    def similaridade_desc(a, b):
        return SequenceMatcher(None, a, b).ratio() if a and b else 0

    for ext in extrato_list:
        melhor_match = None
        melhor_pontuacao = -1

        for idx_cont, cont in enumerate(contab_list):
            if idx_cont in usados_contab:
                continue

            diff_valor = abs(ext['valor_liq'] - cont['valor_liq'])
            if diff_valor > valor_tolerancia:
                continue

            datas_iguais = ext['data_mov'] == cont['data_mov'] or ext['data_valor'] == cont['data_valor']
            if not datas_iguais:
                continue

            sim_desc = similaridade_desc(ext['descritivo'], cont['descritivo'])
            if sim_desc < descricao_sim_threshold:
                continue

            pontuacao = (1 - diff_valor) + sim_desc
            if pontuacao > melhor_pontuacao:
                melhor_pontuacao = pontuacao
                melhor_match = idx_cont

        if melhor_match is not None:
            cont = contab_list[melhor_match]
            status = 'conciliado' if abs(ext['valor_liq'] - cont['valor_liq']) <= valor_tolerancia else 'diferença'
            conciliados.append({
                'extrato_id': ext['id'],
                'contabilidade_id': cont['id'],
                'extrato_descritivo': ext['descritivo'],
                'contab_descritivo': cont['descritivo'],
                'extrato_data_mov': ext['data_mov'],
                'contab_data_mov': cont['data_mov'],
                'extrato_data_valor': ext['data_valor'],
                'contab_data_valor': cont['data_valor'],
                'extrato_valor_liq': ext['valor_liq'],
                'contab_valor_liq': cont['valor_liq'],
                'status': status
            })
            usados_contab.add(melhor_match)

    usados_extrato_ids = {c['extrato_id'] for c in conciliados}
    usados_contab_ids = {c['contabilidade_id'] for c in conciliados}

    somente_extrato = [r for r in extrato_list if r['id'] not in usados_extrato_ids]
    somente_contab = [r for r in contab_list if r['id'] not in usados_contab_ids]

    return {
        'conciliados': conciliados,
        'somente_extrato': somente_extrato,
        'somente_contabilidade': somente_contab,
        'summary': {
            'total_extrato': len(extrato_list),
            'total_contabilidade': len(contab_list),
            'conciliados': len(conciliados),
            'somente_extrato': len(somente_extrato),
            'somente_contabilidade': len(somente_contab)
        }
    }