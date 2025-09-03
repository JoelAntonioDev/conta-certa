import React from "react";

type Props = {
  onSelect: (section: string) => void;
};

const SidebarMenu = ({ onSelect }: Props) => {
  return (
    <div
      style={{
        width: "220px",
        backgroundColor: "#f3f4f6",
        padding: "20px",
        height: "100%",
      }}
    >
      <h3>Reconciliação</h3>
      <ul style={{ listStyle: "none", paddingLeft: 0 }}>
        <li>
          <button onClick={() => onSelect("fiscal")}>↳ Fiscal</button>
        </li>
        <li>
          <button onClick={() => onSelect("contabilistica")}>
            ↳ Contabilística
          </button>
        </li>
        <li>
          <button onClick={() => onSelect("contas_correntes")}>
            ↳ Contas Correntes
          </button>
        </li>
      </ul>
    </div>
  );
};

export default SidebarMenu;
