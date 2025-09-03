// src/components/LicencaProtegida.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Navigate } from "react-router-dom";

const LicencaProtegida = ({ children }: { children: React.ReactNode }) => {
  const [carregando, setCarregando] = useState(true);
  const [licencaValida, setLicencaValida] = useState(false);

  useEffect(() => {
    const verificar = async () => {
      try {
        const res = await axios.get("http://localhost:8001/licenca/status");
        setLicencaValida(res.data.valida === true);
      } catch (err) {
        setLicencaValida(false);
      } finally {
        setCarregando(false);
      }
    };

    verificar();
  }, []);

  if (carregando)
    return <p style={{ padding: "2rem" }}>🔍 Verificando licença...</p>;

  if (!licencaValida) return <Navigate to="/home/gerar_licenca" />;

  return <>{children}</>;
};

export default LicencaProtegida;
