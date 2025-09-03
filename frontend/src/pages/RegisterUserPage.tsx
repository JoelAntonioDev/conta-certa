import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const RegisterUserPage = () => {
  const [username, setUsername] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [msg, setMsg] = useState("");
  const [erro, setErro] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setMsg("");

    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem");
      return;
    }

    try {
      await axios.post("http://localhost:8001/auth/register", {
        username,
        password: senha,
      });
      setMsg("Usuário criado! Agora faça login.");
      navigate("/login");
    } catch (err: any) {
      setErro(err.response?.data?.detail || "Erro ao criar usuário");
    }
  };

  return (
    <div style={styles.container}>
      {/* Left pane com imagem */}
      <div style={styles.leftPane}>
        <img
          src="fundo-login.jpg"
          alt="Registro Visual"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      {/* Right pane com formulário centralizado */}
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
            Criar Conta
          </h2>
          <form onSubmit={handleRegister} style={styles.form}>
            <input
              type="email"
              placeholder="Email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={styles.input}
            />
            <input
              type="password"
              placeholder="Senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              style={styles.input}
            />
            <input
              type="password"
              placeholder="Confirmar senha"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              required
              style={styles.input}
            />
            <button type="submit" style={styles.button}>
              Criar Usuário
            </button>
          </form>

          {msg && <p style={{ color: "green", marginTop: 10 }}>{msg}</p>}
          {erro && <p style={{ color: "red", marginTop: 10 }}>{erro}</p>}

          <button style={styles.linkButton} onClick={() => navigate("/login")}>
            Já tenho conta
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

export default RegisterUserPage;
