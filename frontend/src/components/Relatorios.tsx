import React, { useEffect, useState } from "react";
import axios from "axios";

const Relatorios = () => {
  const [execucoes, setExecucoes] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:8001/relatorios/execucoes")
      .then(res => { setExecucoes(res.data); console.log("dados:" + execucoes); })
      .catch(err => console.error("Erro ao buscar execuções:", err));

  }, []);

  const gerarRelatorio = (id: number, tipo: "pdf" | "excel") => {
    const url = `http://localhost:8001/relatorios/${id}/${tipo}`;
    window.open(url, "_blank"); // abre o ficheiro numa nova aba
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>📑 Relatórios de Conciliação</h1>

      {execucoes.length === 0 ? (
        <p>Nenhuma execução encontrada.</p>
      ) : (
        <table border={1} cellPadding={8} style={{ width: "100%", marginTop: "20px" }}>
          <thead>
            <tr>
              <th>ID Execução</th>
              <th>Empresa</th>
              <th>Data</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {execucoes.map((e: any) => (
              <tr key={e.id}>
                <td>{e.id}</td>
                <td>{e.empresa_id}</td>
                <td>{new Date(e.criado_em).toLocaleString()}</td>
                <td>
                  <button onClick={() => gerarRelatorio(e.id, "pdf")}>📄 PDF</button>
                  <button onClick={() => gerarRelatorio(e.id, "excel")} style={{ marginLeft: "10px" }}>
                    📊 Excel
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Relatorios;
