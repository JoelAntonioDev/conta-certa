import * as XLSX from "xlsx";

type Banco = "bfa" | "bai";
type Modelo = "linha" | "coluna";

interface ExtratoData {
  data: string;
  descricao: string;
  debito: number;
  credito: number;
  saldo?: number;
}

export const extrairDadosExtrato = async (
  file: File,
  banco: Banco,
  modelo: Modelo
): Promise<ExtratoData[]> => {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  if (banco === "bfa") {
    return modelo === "coluna"
      ? parseBfaColuna(jsonData)
      : parseBfaLinha(jsonData);
  }

  if (banco === "bai") {
    return modelo === "coluna"
      ? parseBaiColuna(jsonData)
      : parseBaiLinha(jsonData);
  }

  throw new Error("Banco não suportado.");
};

function parseBfaColuna(rows: any[]): ExtratoData[] {
  return rows.map((row) => ({
    data: row["Data"] || row["DATA"],
    descricao: row["Descrição"] || row["DESCRIÇÃO"],
    debito: parseFloat(row["Débito"] || row["DÉBITO"] || 0),
    credito: parseFloat(row["Crédito"] || row["CRÉDITO"] || 0),
    saldo: parseFloat(row["Saldo"] || row["SALDO"] || 0),
  }));
}

function parseBfaLinha(rows: any[]): ExtratoData[] {
  // Supondo estrutura como:
  // Data | Descrição | Valor | Tipo (C/D)
  return rows.map((row) => {
    const tipo = (row["Tipo"] || "").toUpperCase(); // C/D
    const valor = parseFloat(row["Valor"] || 0);
    return {
      data: row["Data"],
      descricao: row["Descrição"],
      debito: tipo === "D" ? valor : 0,
      credito: tipo === "C" ? valor : 0,
    };
  });
}

function parseBaiColuna(rows: any[]): ExtratoData[] {
  return rows.map((row) => ({
    data: row["Data Valor"] || row["DATA VALOR"],
    descricao: row["Descrição"] || row["DESCRIÇÃO"],
    debito: parseFloat(row["Saídas"] || row["SAÍDAS"] || 0),
    credito: parseFloat(row["Entradas"] || row["ENTRADAS"] || 0),
    saldo: parseFloat(row["Saldo"] || row["SALDO"] || 0),
  }));
}

function parseBaiLinha(rows: any[]): ExtratoData[] {
  // Estrutura alternativa
  return rows.map((row) => {
    const tipo = (row["Movimento"] || "").toUpperCase(); // Entrada/Saída
    const valor = parseFloat(row["Valor"] || 0);
    return {
      data: row["Data"],
      descricao: row["Descrição"],
      debito: tipo === "SAÍDA" ? valor : 0,
      credito: tipo === "ENTRADA" ? valor : 0,
    };
  });
}
