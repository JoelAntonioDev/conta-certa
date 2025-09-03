import React, { useEffect, useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import axios from "axios";
import {
  FaFileAlt,
  FaBalanceScale,
  FaBook,
  FaExchangeAlt,
} from "react-icons/fa";
import "./HomePage.css";
import NavBar from "../components/NavBar";
type EmpresaInfo = {
  nome: string;
  nif: string;
  validade_licenca: string;
};

const HomePage = () => {
  const [empresa, setEmpresa] = useState<EmpresaInfo | undefined>(undefined);
  const location = useLocation();
  const secaoAtual = location.pathname.split("/").pop(); // ex: 'fiscal'

  useEffect(() => {
    const fetchEmpresa = async () => {
      try {
        const res = await axios.get(
          "http://localhost:8001/auth/empresa/detalhes"
        );
        setEmpresa(res.data);
      } catch (err) {
        console.error("Erro ao buscar dados da empresa", err);
      }
    };

    fetchEmpresa();
  }, []);

  const getButtonStyle = (ativo: boolean) => ({
    backgroundColor: ativo ? "#2563eb" : "#e5e7eb",
    color: ativo ? "#fff" : "#111",
    border: "none",
    padding: "8px 16px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: ativo ? "bold" : "normal",
    display: "flex",
    alignItems: "center",
    textDecoration: "none",
  });

  return (
    <div className="home-container">
      <NavBar
        empresa={empresa?.nome || undefined}
        nif={empresa?.nif}
        validade={empresa?.validade_licenca}
      />

      <nav className="home-navbar">
        <Link to="dashboard" style={getButtonStyle(secaoAtual === "dashboard")}>
          <FaFileAlt style={{ marginRight: 6 }} /> Dashboard
        </Link>
        <Link to="fiscal" style={getButtonStyle(secaoAtual === "fiscal")}>
          <FaBalanceScale style={{ marginRight: 6 }} /> Fiscal
        </Link>
        <Link
          to="contabilistica"
          style={getButtonStyle(secaoAtual === "contabilistica")}
        >
          <FaBook style={{ marginRight: 6 }} /> Contabilística
        </Link>
        <Link
          to="contas_correntes"
          style={getButtonStyle(secaoAtual === "contas_correntes")}
        >
          <FaExchangeAlt style={{ marginRight: 6 }} /> Contas Correntes
        </Link>
        <Link
          to="gerar_licenca"
          style={getButtonStyle(secaoAtual === "gerar_licenca")}
        >
          <FaExchangeAlt style={{ marginRight: 6 }} /> Gestão de Licenças
        </Link>
        <Link
          to="relatorios"
          style={getButtonStyle(secaoAtual === "relatorios")}
        >
          <FaFileAlt style={{ marginRight: 6 }} /> Relatórios
        </Link>
      </nav>

      <main style={{ padding: "20px", flex: 1 }}>
        <Outlet />
      </main>
    </div>
  );
};

const styles = {
  container: {
    fontFamily: "sans-serif",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
  } as React.CSSProperties,

  topBar: {
    backgroundColor: "#1f2937",
    color: "#fff",
    padding: "10px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
  } as React.CSSProperties,

  navbar: {
    backgroundColor: "#f9fafb",
    padding: "10px 20px",
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    borderBottom: "1px solid #ccc",
  } as React.CSSProperties,

  main: {
    flex: 1,
    padding: "20px",
  } as React.CSSProperties,

  icon: {
    marginRight: "6px",
  },
};

const getButtonStyle = (ativo: boolean) => ({
  backgroundColor: ativo ? "#2563eb" : "#e5e7eb",
  color: ativo ? "#fff" : "#111",
  border: "none",
  padding: "8px 16px",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: ativo ? "bold" : "normal",
  display: "flex",
  alignItems: "center",
});

export default HomePage;
