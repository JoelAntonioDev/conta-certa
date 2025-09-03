import React from "react";

const LicenseErrorPage = ({ message }: { message: string }) => {
  return (
    <div className="container">
      <h1>Licença inválida ou expirada</h1>
      <p>{message}</p>
    </div>
  );
};

export default LicenseErrorPage;
