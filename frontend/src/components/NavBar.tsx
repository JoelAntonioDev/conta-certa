import React from "react";

type Props = {
  empresa: string | undefined;
  nif: string | undefined;
  validade: string | undefined;
};

const NavBar = ({ empresa, nif, validade }: Props) => {
  const handleLogout = () => {
    // Limpa possíveis tokens, sessões, ou apenas redireciona
    localStorage.clear(); // opcional
    window.location.href = "/login"; // redireciona para login
  };

  return (
    <div
      style={{
        backgroundColor: "#1f2937",
        color: "white",
        padding: "10px 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <h2 style={{ margin: 0 }}>ContaCerta</h2>

      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        <div style={{ fontSize: "0.9rem", textAlign: "right" }}>
          <div>
            <strong>{empresa}</strong>
          </div>
          <div>NIF: {nif}</div>
          <div>Validade: {validade}</div>
        </div>

        <button
          onClick={handleLogout}
          style={{
            backgroundColor: "#ef4444",
            color: "white",
            border: "none",
            padding: "8px 12px",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Sair
        </button>
      </div>
    </div>
  );
};

export default NavBar;
