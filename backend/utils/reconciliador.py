# utils/reconciliador.py
import re
from datetime import timedelta
from difflib import SequenceMatcher
import pandas as pd
import numpy as np
from typing import Dict, Any, List

# ---------------- Helpers ----------------
def _norm_name(s: str) -> str:
    if s is None:
        return ""
    return re.sub(r"[^a-z0-9]", "", str(s).lower())

def _find_col(df: pd.DataFrame, *candidates: str):
    """Procura a primeira coluna do df que case (normalizado) com algum dos candidates."""
    norm_cols = { _norm_name(c): c for c in df.columns }
    for cand in candidates:
        key = _norm_name(cand)
        if key in norm_cols:
            return norm_cols[key]
    # fallback: busca se candidate está *contido* em alguma coluna normalizada
    for cand in candidates:
        key = _norm_name(cand)
        for nc, orig in norm_cols.items():
            if key in nc or nc in key:
                return orig
    return None

def parse_valor_ptbr(valor):
    """Converte '-2.507,55' ou '2 507,55' para float -2507.55. Nulos -> 0.0"""
    if pd.isna(valor) or valor == "":
        return 0.0
    if isinstance(valor, (int, float, np.floating, np.integer)):
        return float(valor)
    s = str(valor).strip()
    # keep sign
    sign = -1 if s.startswith("-") else 1
    s = s.lstrip("+-")
    s = s.replace(" ", "")
    # remove thousands dots, replace decimal comma
    s = s.replace(".", "").replace(",", ".")
    try:
        return sign * float(s)
    except:
        try:
            return float(s)
        except:
            return 0.0

def clean_text(s: str) -> str:
    if pd.isna(s):
        return ""
    s = str(s).lower()
    s = re.sub(r"[^\w\s]", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s

def desc_similarity(a: str, b: str) -> float:
    a_c = clean_text(a)
    b_c = clean_text(b)
    if not a_c or not b_c:
        return 0.0
    ratio = SequenceMatcher(None, a_c, b_c).ratio()
    tokens_a = set(a_c.split())
    tokens_b = set(b_c.split())
    jaccard = len(tokens_a & tokens_b) / max(1, len(tokens_a | tokens_b))
    return max(ratio, jaccard)

# ---------------- Normalizers ----------------
def normalize_extrato_bai(df: pd.DataFrame) -> pd.DataFrame:
    df2 = df.copy()
    # detect columns flexívelmente
    col_data_mov = _find_col(df2, "data mov.", "data movimento", "data mov", "data_mov")
    col_data_val = _find_col(df2, "data valor", "data_valor", "data valor")
    col_desc = _find_col(df2, "descritivo", "descritivo")
    col_deb = _find_col(df2, "débito", "debito", "debito kz", "debito kz", "debito_kz")
    col_cred = _find_col(df2, "crédito", "credito", "credito kz", "credito_kz")
    col_saldo = _find_col(df2, "movimento", "saldo", "saldo disponivel", "saldo_disponivel", "saldo apos movimento")

    # create normalized columns
    df2["date_mov"] = pd.to_datetime(df2[col_data_mov], dayfirst=True, errors="coerce") if col_data_mov else pd.to_datetime(None)
    df2["date_val"] = pd.to_datetime(df2[col_data_val], dayfirst=True, errors="coerce") if col_data_val else pd.to_datetime(None)
    df2["desc"] = df2[col_desc].astype(str) if col_desc else ""
    df2["_deb_raw"] = df2[col_deb] if col_deb else 0
    df2["_cred_raw"] = df2[col_cred] if col_cred else 0
    df2["debito"] = df2["_deb_raw"].apply(parse_valor_ptbr)
    df2["credito"] = df2["_cred_raw"].apply(parse_valor_ptbr)
    # extrato bancário: amount = credito - debito  (positivo = entrada)
    df2["amount"] = (df2["credito"].fillna(0.0) - df2["debito"].fillna(0.0)).round(2)
    df2["saldo"] = df2[col_saldo].apply(parse_valor_ptbr) if col_saldo else np.nan
    df2 = df2.reset_index().rename(columns={"index":"orig_index"})
    return df2[["orig_index","date_mov","date_val","desc","debito","credito","amount","saldo"]]

def normalize_contabilidade(df: pd.DataFrame) -> pd.DataFrame:
    df2 = df.copy()
    col_data_mov = _find_col(df2, "data movimento", "data mov", "data_movimento")
    col_data_val = _find_col(df2, "data valor", "data_valor")
    col_desc = _find_col(df2, "descritivo", "descritivo")
    col_deb = _find_col(df2, "debito kz", "debito", "debito_kz")
    col_cred = _find_col(df2, "credito kz", "credito", "credito_kz")
    col_saldo = _find_col(df2, "saldo disponivel", "saldo_disponivel", "saldo disponivel kz", "saldo")
    df2["date_mov"] = pd.to_datetime(df2[col_data_mov], dayfirst=True, errors="coerce") if col_data_mov else pd.to_datetime(None)
    df2["date_val"] = pd.to_datetime(df2[col_data_val], dayfirst=True, errors="coerce") if col_data_val else pd.to_datetime(None)
    df2["desc"] = df2[col_desc].astype(str) if col_desc else ""
    df2["_deb_raw"] = df2[col_deb] if col_deb else 0
    df2["_cred_raw"] = df2[col_cred] if col_cred else 0
    df2["debito"] = df2["_deb_raw"].apply(parse_valor_ptbr)
    df2["credito"] = df2["_cred_raw"].apply(parse_valor_ptbr)
    # contabilidade: débito = entrada, crédito = saída -> amount = débito - crédito
    df2["amount"] = (df2["debito"].fillna(0.0) - df2["credito"].fillna(0.0)).round(2)
    df2["saldo"] = df2[col_saldo].apply(parse_valor_ptbr) if col_saldo else np.nan
    df2 = df2.reset_index().rename(columns={"index":"orig_index"})
    return df2[["orig_index","date_mov","date_val","desc","debito","credito","amount","saldo"]]

# ---------------- Reconciliation core ----------------
def reconcile_movements(extrato_df: pd.DataFrame, contab_df: pd.DataFrame,
                        amount_tolerance: float = 0.01,
                        date_tolerance_days: int = 1,
                        desc_similarity_threshold: float = 0.55) -> Dict[str, Any]:
    """
    Retorna dict com:
      - matches: list of matched pairs (automatic)
      - potential: list of suggested pairs (fuzzy)
      - unmatched_extrato: list of extrato rows not matched
      - unmatched_contabilidade: list of contabilidade rows not matched
      - summary: counts
    """
    ext = normalize_extrato_bai(extrato_df)
    cont = normalize_contabilidade(contab_df)

    ext["_matched"] = False
    cont["_matched"] = False

    matches: List[Dict[str,Any]] = []
    potential: List[Dict[str,Any]] = []

    # Stage 1: exact amount + same date (date_only)
    ext["date_only"] = ext["date_mov"].dt.date
    cont["date_only"] = cont["date_mov"].dt.date

    merge1 = pd.merge(ext.loc[~ext["_matched"]], cont.loc[~cont["_matched"]],
                      left_on=["amount","date_only"], right_on=["amount","date_only"],
                      suffixes=("_ext","_cont"), how="inner")

    for _, r in merge1.iterrows():
        matches.append({
            "ext_idx": int(r["orig_index_ext"]),
            "cont_idx": int(r["orig_index_cont"]),
            "amount": float(r["amount"]),
            "date_ext": str(r["date_mov_ext"].date()) if pd.notna(r["date_mov_ext"]) else None,
            "date_cont": str(r["date_mov_cont"].date()) if pd.notna(r["date_mov_cont"]) else None,
            "desc_ext": r["desc_ext"],
            "desc_cont": r["desc_cont"],
            "amount_diff": 0.0,
            "date_diff_days": 0,
            "desc_similarity": float(desc_similarity(r["desc_ext"], r["desc_cont"])),
            "status":"matched_exact"
        })
        ext.loc[ext["orig_index"]==r["orig_index_ext"], "_matched"] = True
        cont.loc[cont["orig_index"]==r["orig_index_cont"], "_matched"] = True

    # Stage 2: fuzzy by amount tolerance + date tolerance + description similarity
    ext_cands = ext[~ext["_matched"]].copy()
    cont_cands = cont[~cont["_matched"]].copy()

    for _, erow in ext_cands.iterrows():
        if erow["_matched"]:
            continue
        amt = erow["amount"]
        lower, upper = amt - amount_tolerance, amt + amount_tolerance
        cands = cont_cands[(cont_cands["amount"] >= lower) & (cont_cands["amount"] <= upper) & (~cont_cands["_matched"])]
        best = None
        best_score = -999
        for _, crow in cands.iterrows():
            # date diff
            date_diff = None
            if pd.notna(erow["date_mov"]) and pd.notna(crow["date_mov"]):
                date_diff = abs((erow["date_mov"].date() - crow["date_mov"].date()).days)
            # only accept if within date_tolerance_days or date missing
            if date_diff is not None and date_diff > date_tolerance_days:
                # still consider but penalize
                pass
            sim = desc_similarity(erow["desc"], crow["desc"])
            # score = sim - small penalty for date_diff
            score = sim - (0.01 * (date_diff if date_diff is not None else 0))
            if score > best_score:
                best_score = score
                best = (crow, sim, date_diff)
        if best is not None and best_score >= desc_similarity_threshold:
            crow, sim, date_diff = best
            matches.append({
                "ext_idx": int(erow["orig_index"]),
                "cont_idx": int(crow["orig_index"]),
                "amount": float(amt),
                "date_ext": str(erow["date_mov"].date()) if pd.notna(erow["date_mov"]) else None,
                "date_cont": str(crow["date_mov"].date()) if pd.notna(crow["date_mov"]) else None,
                "desc_ext": erow["desc"],
                "desc_cont": crow["desc"],
                "amount_diff": float(round(erow["amount"] - crow["amount"], 2)),
                "date_diff_days": int(date_diff) if date_diff is not None else None,
                "desc_similarity": float(sim),
                "status":"matched_fuzzy"
            })
            ext.loc[ext["orig_index"]==erow["orig_index"], "_matched"] = True
            cont.loc[cont["orig_index"]==crow["orig_index"], "_matched"] = True
        else:
            # suggest potential amount-only matches (closest date)
            if not cands.empty:
                # choose candidate with smallest date diff (or first if dates missing)
                best2 = None
                best_dd = 10**6
                for _, crow in cands.iterrows():
                    dd = None
                    if pd.notna(erow["date_mov"]) and pd.notna(crow["date_mov"]):
                        dd = abs((erow["date_mov"].date() - crow["date_mov"].date()).days)
                    dd_val = 999999 if dd is None else dd
                    if dd_val < best_dd:
                        best_dd = dd_val
                        best2 = (crow, dd)
                crow, dd = best2
                potential.append({
                    "ext_idx": int(erow["orig_index"]),
                    "cont_idx": int(crow["orig_index"]),
                    "amount": float(amt),
                    "date_ext": str(erow["date_mov"].date()) if pd.notna(erow["date_mov"]) else None,
                    "date_cont": str(crow["date_mov"].date()) if pd.notna(crow["date_mov"]) else None,
                    "desc_ext": erow["desc"],
                    "desc_cont": crow["desc"],
                    "amount_diff": float(round(erow["amount"] - crow["amount"], 2)),
                    "date_diff_days": int(dd) if dd is not None else None,
                    "desc_similarity": float(desc_similarity(erow["desc"], crow["desc"])),
                    "status":"potential"
                })
                # do not auto-mark matched

    unmatched_ext = ext[~ext["_matched"]].copy()
    unmatched_cont = cont[~cont["_matched"]].copy()

    summary = {
        "total_extrato": int(len(ext)),
        "total_contabilidade": int(len(cont)),
        "matched_auto": len([m for m in matches if m["status"].startswith("matched")]),
        "potential": len(potential),
        "unmatched_extrato": int(len(unmatched_ext)),
        "unmatched_contabilidade": int(len(unmatched_cont))
    }

    result = {
        "matches": matches,
        "potential": potential,
        "unmatched_extrato": unmatched_ext.fillna("").to_dict(orient="records"),
        "unmatched_contabilidade": unmatched_cont.fillna("").to_dict(orient="records"),
        "summary": summary
    }
    return result
