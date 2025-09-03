import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import axios from "axios";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import CreateCompanyPage from "./pages/CreateCompanyPage";
import RegisterUserPage from "./pages/RegisterUserPage";
import GerarLicencaPage from "./pages/GerarLicensaPage";
import Dashboard from "./pages/Dashboard";
import Relatorios from "./components/Relatorios";
import LicencaProtegida from "./components/LicencaProtegida";
import ReconciliaçãoFiscal from "./components/ReconciliacaoFiscal/ReconciliacaoFiscal";
import ReconCiliacaoContabil from "./components/ReconciliacaoContabil/ReconciliacaoContabil";
const App = () => {
  const [etapa, setEtapa] = useState<"loading" | "ok">("loading");
  const [redirectPath, setRedirectPath] = useState("/");

  useEffect(() => {
    const inicializar = async () => {
      try {
        const empresaRes = await axios.get(
          "http://localhost:8001/auth/empresa"
        );
        if (!empresaRes.data.existe) {
          setRedirectPath("/criar-empresa");
          setEtapa("ok");
          return;
        }

        const userRes = await axios.get("http://localhost:8001/auth/usuarios");
        if (userRes.data.total === 0) {
          setRedirectPath("/criar-usuario");
          setEtapa("ok");
          return;
        }

        setRedirectPath("/login");
      } catch (err) {
        console.error("Erro ao inicializar:", err);
        setRedirectPath("/login");
      } finally {
        setEtapa("ok");
      }
    };

    inicializar();
  }, []);

  if (etapa === "loading") {
    return <p style={{ padding: "2rem" }}>🔄 Inicializando aplicação...</p>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to={redirectPath} />} />
        <Route path="/criar-empresa" element={<CreateCompanyPage />} />
        <Route path="/criar-usuario" element={<RegisterUserPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="*" element={<p>404 - Página não encontrada</p>} />
        <Route path="/home" element={<HomePage />}>
          <Route
            path="dashboard"
            element={
              <LicencaProtegida>
                <Dashboard />
              </LicencaProtegida>
            }
          />
          <Route
            path="fiscal"
            element={
              <LicencaProtegida>
                <ReconciliaçãoFiscal />
              </LicencaProtegida>
            }
          />
          <Route
            path="contabilistica"
            element={
              <LicencaProtegida>
                <ReconCiliacaoContabil />{" "}
                {/* <- Aqui agora é o componente novo */}
              </LicencaProtegida>
            }
          />
          <Route
            path="contas_correntes"
            element={
              <LicencaProtegida>
                <div>💼 Componente: Contas Correntes</div>
              </LicencaProtegida>
            }
          />
          <Route
            path="relatorios"
            element={
              <LicencaProtegida>
                <Relatorios />
              </LicencaProtegida>
            }
          />
          <Route path="gerar_licenca" element={<GerarLicencaPage />} />{" "}
          {/* sem proteção */}
          <Route index element={<Navigate to="dashboard" />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
