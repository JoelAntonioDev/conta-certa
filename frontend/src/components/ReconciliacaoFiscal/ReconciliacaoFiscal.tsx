import React, { useRef, useState, useEffect } from "react";
import { FaFileImport } from "react-icons/fa";
import axios from "axios";
import { toast } from "react-toastify";
import "./ReconciliacaoFiscal.css";
import Pagination from "../Pagination";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const ReconciliaçãoFiscal = () => {
  const [fornecedoresFile, setFornecedoresFile] = useState<File | null>(null);
  const [retencaoFile, setRetencaoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadConcluido, setUploadConcluido] = useState(false);
  const itensPorPagina = 10;
  const [conciliados, setConciliados] = useState<any[]>([]);
  const [divergentesIva, setDivergentesIva] = useState<any[]>([]);
  const [soAGT, setSoAGT] = useState<any[]>([]);
  const [soCont, setSoCont] = useState<any[]>([]);
  const [paginaConciliados, setPaginaConciliados] = useState(1);
  const [paginaIva, setPaginaIva] = useState(1);
  const [paginaAGT, setPaginaAGT] = useState(1);
  const [paginaCont, setPaginaCont] = useState(1);
  const fornecedoresInputRef = useRef<HTMLInputElement>(null);
  const retencaoInputRef = useRef<HTMLInputElement>(null);
  ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);
  const dataResumo = {
    labels: [
      "Conciliado",
      "Divergência no IVA",
      "Só na AGT",
      "Só na Contabilidade",
    ],
    datasets: [
      {
        label: "Número de Faturas",
        data: [
          conciliados.length,
          divergentesIva.length,
          soAGT.length,
          soCont.length,
        ],
        backgroundColor: ["green", "orange", "red", "blue"],
        borderWidth: 1,
      },
    ],
  };

  const optionsResumo = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Número de Faturas",
        },
      },
      x: {
        title: {
          display: true,
          text: "Categoria",
        },
      },
    },
  };
  const paginar = (arr: any[], pagina: number) => {
    const start = (pagina - 1) * itensPorPagina;
    return arr.slice(start, start + itensPorPagina);
  };
  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    setter: React.Dispatch<React.SetStateAction<File | null>>
  ) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      setter(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  const handleUpload = async () => {
    if (!fornecedoresFile || !retencaoFile) {
      toast.error("Selecione ambos os ficheiros antes de importar.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("fornecedores", fornecedoresFile);
    formData.append("retencao", retencaoFile);

    try {
      await axios.post("http://localhost:8001/fiscal/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("✅ Ficheiros importados com sucesso!");
      setFornecedoresFile(null);
      setRetencaoFile(null);
      setUploadConcluido(true);
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao importar ficheiros.");
    } finally {
      setLoading(false);
    }
  };

  const handleReconciliar = async () => {
    try {
      toast.info("🧮 Iniciando reconciliação...");
      const res = await axios.post("http://localhost:8001/fiscal/reconciliar", {
        empresa_id: 3,
        periodo: "2025-01",
      });
      console.log("Resposta da reconciliação:", res.data);
      // 👇 Remova .dados se a resposta já for o objeto plano
      setConciliados(res.data.dados.conciliados || []);
      setDivergentesIva(res.data.dados.divergentes_iva || []);
      setSoAGT(res.data.dados.so_agt || []);
      setSoCont(res.data.dados.so_contabilidade || []);

      toast.success("🎯 Reconciliação concluída com sucesso!");
    } catch (err: any) {
      console.error(err);
      toast.error("❌ Erro ao realizar reconciliação.");
    }
  };

  useEffect(() => {
    console.log("✅ Conciliados:", conciliados);
    console.log("⚠️ Divergentes no IVA:", divergentesIva);
    console.log("📄 Só AGT:", soAGT);
    console.log("📄 Só Contabilidade:", soCont);
  }, [conciliados, divergentesIva, soAGT, soCont]);

  const exportarRelatorioPDF = () => {
    const doc = new jsPDF();
    let currentY = 10; // posição inicial no PDF

    const adicionarSecao = (titulo: string, data: any[], bgColor: string) => {
      if (data.length === 0) return;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(255);
      doc.setFillColor(bgColor);
      doc.rect(10, currentY, 190, 10, "F");
      doc.text(titulo, 15, currentY + 7);

      currentY += 12;

      const colunas = Object.keys(data[0] || {}).filter(
        (col) =>
          !col.toLowerCase().includes("unnamed") &&
          !col.toLowerCase().includes("normalizado")
      );

      const linhas = data.map((item) => colunas.map((col) => item[col] ?? ""));

      autoTable(doc, {
        head: [colunas],
        body: linhas,
        startY: currentY,
        styles: {
          fontSize: 7,
          overflow: "linebreak",
          cellWidth: "wrap",
        },
        headStyles: {
          fillColor: [50, 50, 50],
          textColor: 255,
          halign: "center",
        },
        margin: { left: 10, right: 10 },
        theme: "striped",
        didDrawPage: (data) => {
          currentY = data.cursor.y + 10;
        },
      });
    };

    adicionarSecao("✅ Conciliados", conciliados, "#28a745"); // verde
    adicionarSecao("⚠️ Divergência no IVA", divergentesIva, "#fd7e14"); // laranja
    adicionarSecao("📄 Só no Mapa AGT", soAGT, "#dc3545"); // vermelho
    adicionarSecao("📄 Só na Contabilidade", soCont, "#007bff"); // azul

    doc.save("Relatorio_Consolidacao_Fiscal.pdf");
  };
  const exportarRelatorioExcel = () => {
    const wb = XLSX.utils.book_new();

    const exportarSheet = (dados: any[], nomeSheet: string) => {
      if (dados.length === 0) return;
      const colunas = Object.keys(dados[0]).filter(
        (col) =>
          !col.toLowerCase().includes("unnamed") &&
          !col.toLowerCase().includes("normalizado")
      );
      const dadosLimpos = dados.map((item) => {
        const obj: any = {};
        colunas.forEach((col) => {
          obj[col] = item[col];
        });
        return obj;
      });

      const ws = XLSX.utils.json_to_sheet(dadosLimpos);
      XLSX.utils.book_append_sheet(wb, ws, nomeSheet);
    };

    exportarSheet(conciliados, "Conciliados");
    exportarSheet(divergentesIva, "Divergência IVA");
    exportarSheet(soAGT, "Só AGT");
    exportarSheet(soCont, "Só Contabilidade");

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "Relatorio_Consolidacao_Fiscal.xlsx");
  };
  return (
    <div className="recon-container">
      <h2>🧾 Reconciliação Fiscal</h2>

      {!uploadConcluido && (
        <div className="upload-section-horizontal">
          {/* Fornecedores */}
          <div
            className="upload-box"
            onClick={() => fornecedoresInputRef.current?.click()}
            onDrop={(e) => handleDrop(e, setFornecedoresFile)}
            onDragOver={(e) => e.preventDefault()}
          >
            <label>📄 Mapa de Fornecedores</label>
            <input
              type="file"
              ref={fornecedoresInputRef}
              accept=".pdf,.xlsx"
              onChange={(e) => setFornecedoresFile(e.target.files?.[0] || null)}
              style={{ display: "none" }}
            />
            {fornecedoresFile ? (
              <p>{fornecedoresFile.name}</p>
            ) : (
              <p className="hint">Arraste ou clique para selecionar</p>
            )}
          </div>

          {/* Retenção */}
          <div
            className="upload-box"
            onClick={() => retencaoInputRef.current?.click()}
            onDrop={(e) => handleDrop(e, setRetencaoFile)}
            onDragOver={(e) => e.preventDefault()}
          >
            <label>📄 Retenção na Fonte</label>
            <input
              type="file"
              ref={retencaoInputRef}
              accept=".pdf,.xlsx"
              onChange={(e) => setRetencaoFile(e.target.files?.[0] || null)}
              style={{ display: "none" }}
            />
            {retencaoFile ? (
              <p>{retencaoFile.name}</p>
            ) : (
              <p className="hint">Arraste ou clique para selecionar</p>
            )}
          </div>
        </div>
      )}

      {!uploadConcluido ? (
        <button
          className="btn-secundario"
          onClick={handleUpload}
          disabled={loading}
        >
          {loading ? (
            "⏳ Importando..."
          ) : (
            <>
              <FaFileImport style={{ marginRight: 5 }} />
              Importar Ficheiros
            </>
          )}
        </button>
      ) : (
        <button className="btn-secundario" onClick={handleReconciliar}>
          🧮 Fazer Reconciliação
        </button>
      )}

      {(conciliados.length > 0 ||
        divergentesIva.length > 0 ||
        soAGT.length > 0 ||
        soCont.length > 0) && (
        <div className="resultados">
          {(conciliados.length > 0 ||
            divergentesIva.length > 0 ||
            soAGT.length > 0 ||
            soCont.length > 0) && (
            <div>
              {" "}
              <button className="btn-primario" onClick={exportarRelatorioPDF}>
                📄 Exportar Relatório em PDF
              </button>
              <button className="btn-primario" onClick={exportarRelatorioExcel}>
                📊 Exportar Relatório em Excel
              </button>
            </div>
          )}

          {/* Conciliados */}
          <h3>✅ Conciliados ({conciliados.length})</h3>
          {paginar(conciliados, paginaConciliados).map((item, index) => (
            <div key={index} className="resultado-card">
              <strong>{item.numero_documento}</strong>
              <small>NIF: {item.nif}</small>
              <small>Valor: {item.valor_documento}</small>
            </div>
          ))}
          <Pagination
            currentPage={paginaConciliados}
            totalPages={Math.ceil(conciliados.length / itensPorPagina)}
            onPageChange={setPaginaConciliados}
          />

          {/* Divergência no IVA */}
          <h3>⚠️ Divergência no IVA ({divergentesIva.length})</h3>
          {paginar(divergentesIva, paginaIva).map((item, index) => (
            <div key={index} className="resultado-card">
              <strong>{item.numero_documento}</strong>
              <small>NIF: {item.nif}</small>
              <small>IVA AGT: {item.iva_dedutivel_agt}</small>
              <small>IVA CONT: {item.iva_dedutivel_cont}</small>
            </div>
          ))}
          <Pagination
            currentPage={paginaIva}
            totalPages={Math.ceil(divergentesIva.length / itensPorPagina)}
            onPageChange={setPaginaIva}
          />

          {/* Só AGT */}
          <h3>📄 Só no Mapa AGT ({soAGT.length})</h3>
          {paginar(soAGT, paginaAGT).map((item, index) => (
            <div key={index} className="resultado-card">
              <strong>{item.numero_documento}</strong>
              <small>NIF: {item.nif}</small>
              <small>Valor: {item.valor_documento}</small>
            </div>
          ))}
          <Pagination
            currentPage={paginaAGT}
            totalPages={Math.ceil(soAGT.length / itensPorPagina)}
            onPageChange={setPaginaAGT}
          />

          {/* Só Contabilidade */}
          <h3>📄 Só na Contabilidade ({soCont.length})</h3>
          {paginar(soCont, paginaCont).map((item, index) => (
            <div key={index} className="resultado-card">
              <strong>{item.numero_documento}</strong>
              <small>NIF: {item.nif}</small>
              <small>Valor: {item.valor_documento}</small>
            </div>
          ))}
          <Pagination
            currentPage={paginaCont}
            totalPages={Math.ceil(soCont.length / itensPorPagina)}
            onPageChange={setPaginaCont}
          />
        </div>
      )}
      <div className="grafico-resumo">
        <h3>📊 Resumo da Conciliação Fiscal</h3>
        <Bar data={dataResumo} options={optionsResumo} />
      </div>
    </div>
  );
};

export default ReconciliaçãoFiscal;
