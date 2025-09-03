import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:8001/auth/login", {
        email,
        senha,
      });

      localStorage.setItem("token", res.data.access_token);
      toast.success("Login bem-sucedido! Redirecionando...");

      setTimeout(() => {
        navigate("/home");
      }, 2000);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Falha no login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <ToastContainer position="top-center" />
      <div style={styles.leftPane}>
        <img
          src="fundo-login.jpg"
          alt="Login Visual"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

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
            Bem-vindo de volta 👋
          </h2>

          <form onSubmit={handleLogin} style={styles.form}>
            <input
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
            />
            <input
              type="password"
              placeholder="Senha"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              style={styles.input}
            />
            <button
              type="submit"
              style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
              disabled={loading}
            >
              {loading ? "⏳ Entrando..." : "Entrar"}
            </button>
          </form>

          <button
            style={styles.linkButton}
            onClick={() => navigate("/criar-usuario")}
          >
            Criar conta
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

export default LoginPage;
