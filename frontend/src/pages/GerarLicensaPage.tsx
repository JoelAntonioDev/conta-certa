import React, { useEffect, useState } from "react";
import axios from "axios";

const GerarLicencaPage = () => {
  const [validade, setValidade] = useState("");
  const [licenca, setLicenca] = useState<string | null>(null);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [loading, setLoading] = useState(false);
  const [finalizado, setFinalizado] = useState(false);
  const [licencaAtiva, setLicencaAtiva] = useState(false);

  useEffect(() => {
    const verificarLicenca = async () => {
      try {
        const res = await axios.get("http://localhost:8001/licenca/status");
        if (res.data?.valida) {
          setLicencaAtiva(true);
          setLicenca(JSON.stringify(res.data.dados, null, 2));
        }
        console.log("activa:" + res.data?.valida);
      } catch (err) {
        console.warn("Nenhuma licença ativa encontrada");
      }
    };

    verificarLicenca();
  }, []);

  const handleGerar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setSucesso("");
    setLicenca(null);
    setLoading(true);
    setFinalizado(false);

    try {
      const detalhes = await axios.get(
        "http://localhost:8001/auth/empresa/info-completa"
      );

      const { empresa, nif, machine_id } = detalhes.data;

      const response = await axios.post(
        "https://licenca-backend.onrender.com/api/gerar-licenca",
        {
          empresa,
          nif,
          machine_id,
          validade,
        }
      );

      const licencaGerada = response.data;
      const licencaJson = JSON.stringify(licencaGerada, null, 2);
      setLicenca(licencaJson);

      const blob = new Blob([licencaJson], { type: "application/json" });
      const formData = new FormData();
      formData.append("file", blob, "licenca.lic");

      await axios.post("http://localhost:8001/licenca/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSucesso("✅ Licença gerada e enviada com sucesso.");
      setFinalizado(true);
      setLicencaAtiva(true);
    } catch (err: any) {
      console.error(err);
      setErro(
        err.response?.data?.erro ||
          err.response?.data?.detail ||
          "Erro ao gerar ou enviar licença"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleIniciar = () => {
    window.location.href = "/home/dashboard"; // ajuste conforme suas rotas reais
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h2>🔐 Gerar Licença</h2>

      {loading ? (
        <p>⏳ Gerando e enviando licença...</p>
      ) : finalizado ? (
        <>
          <p style={{ color: "green" }}>{sucesso}</p>
          <button onClick={handleIniciar}>🚀 Começar a usar o sistema</button>
        </>
      ) : licencaAtiva ? (
        <>
          <p style={{ color: "green" }}>✅ Licença já está ativa e válida.</p>
          <button onClick={handleIniciar}>🚀 Começar a usar o sistema</button>
        </>
      ) : (
        <form onSubmit={handleGerar}>
          <label>Validade (YYYY-MM-DD):</label>
          <input
            type="date"
            required
            value={validade}
            onChange={(e) => setValidade(e.target.value)}
          />
          <br />
          <button type="submit" disabled={!validade}>
            Gerar
          </button>
        </form>
      )}

      {erro && <p style={{ color: "red" }}>{erro}</p>}

      {licenca && (
        <div>
          <h3>Licença Atual:</h3>
          <pre>{licenca}</pre>
        </div>
      )}
    </div>
  );
};

export default GerarLicencaPage;
