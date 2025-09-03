import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const CreateCompanyPage = () => {
  const [nome, setNome] = useState("");
  const [nif, setNif] = useState("");
  const [validade, setValidade] = useState("");
  const [msg, setMsg] = useState("");
  const [erro, setErro] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setMsg("");

    try {
      await axios.post("http://localhost:8001/auth/empresa", {
        nome,
        nif,
        validade_licenca: validade,
      });
      setMsg("Empresa criada com sucesso!");
      navigate("/criar-usuario");
    } catch (err: any) {
      setErro(err.response?.data?.detail || "Erro ao criar empresa");
    }
  };

  return (
    <div style={styles.container}>
      {/* Imagem à esquerda */}
      <div style={styles.leftPane}>
        <img
          src="fundo-login.jpg"
          alt="Empresa Visual"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      {/* Formulário à direita */}
      <div style={styles.rightPane}>
        <div style={styles.formWrapper}>
          <h1
            style={{
              marginBottom: "1.5rem",
              color: "#2563eb",
              textAlign: "center",
            }}
          >
            ContaCerta
          </h1>
          <h2 style={{ marginBottom: "1rem", textAlign: "center" }}>
            Criar Empresa
          </h2>
          <form onSubmit={handleSubmit} style={styles.form}>
            <input
              type="text"
              placeholder="Nome da empresa"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              style={styles.input}
            />
            <input
              type="text"
              placeholder="NIF"
              value={nif}
              onChange={(e) => setNif(e.target.value)}
              required
              style={styles.input}
            />
            <input
              type="date"
              value={validade}
              onChange={(e) => setValidade(e.target.value)}
              required
              style={styles.input}
            />
            <button type="submit" style={styles.button}>
              Criar Empresa
            </button>
          </form>

          {msg && <p style={{ color: "green", marginTop: 10 }}>{msg}</p>}
          {erro && <p style={{ color: "red", marginTop: 10 }}>{erro}</p>}

          <button
            style={styles.linkButton}
            onClick={() => navigate("/criar-usuario")}
          >
            Já tenho uma empresa
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: "flex",
    height: "100vh",
    fontFamily: "sans-serif",
  },
  leftPane: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  rightPane: {
    flex: 1,
    backgroundColor: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  formWrapper: {
    width: "100%",
    maxWidth: 400,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  input: {
    padding: "0.8rem",
    fontSize: "1rem",
    borderRadius: "6px",
    border: "1px solid #ccc",
  },
  button: {
    padding: "0.8rem",
    fontSize: "1rem",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "#2563eb",
    color: "white",
    cursor: "pointer",
  },
  linkButton: {
    marginTop: "1rem",
    background: "none",
    border: "none",
    color: "#2563eb",
    cursor: "pointer",
    fontSize: "0.95rem",
    textDecoration: "underline",
    textAlign: "center",
  },
};

export default CreateCompanyPage;
