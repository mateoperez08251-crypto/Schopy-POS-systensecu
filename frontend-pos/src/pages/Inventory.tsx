import React from "react";
import TopNav from "../components/TopNav";

const Inventory = () => {
  return (
    <main className="main-content">
      <TopNav title="Gestión de Inventario" />
      <div className="card" style={{ padding: "40px", textAlign: "center", marginTop: "40px" }}>
        <h2>Inventario</h2>
        <p style={{ color: "var(--text-muted)", marginTop: "10px" }}>Aquí irá la tabla de productos, stock, y gestión de proveedores.</p>
      </div>
    </main>
  );
};
export default Inventory;
