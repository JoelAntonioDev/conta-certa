import React, { useEffect, useState } from "react";
import axios from "axios";

const LicenseManagerPage = () => {
  const [info, setInfo] = useState<{
    empresa: string;
    nif: string;
    validade: string;
    machine_id: string;
  } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    axios
      .get("http://localhost:8001/licenca/detalhes")
      .then((res) => setInfo(res.data))
      .catch(() => setMsg("Licença atual não encontrada"));
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    const form = new FormData();
    form.append("file", file);

    try {
      const res = await axios.post(
        "http://localhost:8000/licenca/substituir",
        form,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setMsg("✅ " + res.data.msg);
    } catch (err: any) {
      setMsg(
        "❌ " + (err.response?.data?.detail || "Erro ao substituir licença")
      );
    }
  };

  return (
    <div className="container">
      <h2>Status da Licença</h2>
      {info ? (
        <ul>
          <li>
            <strong>Empresa:</strong> {info.empresa}
          </li>
          <li>
            <strong>Validade:</strong> {info.validade}
          </li>
          <li>
            <strong>ID da Máquina:</strong> {info.machine_id}
          </li>
        </ul>
      ) : (
        <p>{msg || "Carregando licença..."}</p>
      )}

      <hr />
      <h3>Substituir licença</h3>
      <input
        type="file"
        accept=".lic"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <button onClick={handleUpload}>Substituir</button>

      {msg && <p>{msg}</p>}
    </div>
  );
};

export default LicenseManagerPage;
