import React from "react";
import TopNav from "../components/TopNav";

const Audit = () => {
  return (
    <main className="main-content">
      <TopNav title="Auditoría IA" />
      <div className="card" style={{ padding: "40px", textAlign: "center", marginTop: "40px" }}>
        <h2>Auditoría de Cámaras y Prevención de Pérdidas</h2>
        <p style={{ color: "var(--text-muted)", marginTop: "10px" }}>Aquí se mostrarán los clips de video de 5s de las alertas de fraude y omisión de escaneo.</p>
      </div>
    </main>
  );
};
export default Audit;
