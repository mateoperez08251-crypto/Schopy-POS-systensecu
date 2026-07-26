import React, { useState } from "react";
import TopNav from "../components/TopNav";
import { ShieldAlert, AlertTriangle, Search, Filter, Play, CheckCircle2, XCircle, Activity, Database, Clock } from "lucide-react";
import VideoEvidenceModal from "../components/audit/VideoEvidenceModal";

const SYSTEM_LOGS = [
  { id: "LOG-902", time: "11:45 AM", user: "Admin", action: "CREAR_PRODUCTO", details: "Se agregó 'Coca Cola 2L' al inventario (Stock: 50)" },
  { id: "LOG-901", time: "11:30 AM", user: "Cajero Carlos R.", action: "NUEVA_VENTA", details: "Venta procesada #1042 por $124.50" },
  { id: "LOG-900", time: "10:42 AM", user: "Sistema IA", action: "ALERTA_GENERADA", details: "Alerta INC-2039 generada por Omisión de Escaneo" },
  { id: "LOG-899", time: "09:15 AM", user: "Supervisor Ana M.", action: "REVISION_ALERTA", details: "Alerta INC-2038 marcada como Revisada" },
  { id: "LOG-898", time: "08:00 AM", user: "Sistema", action: "INICIO_TURNO", details: "Caja 1 abierta con $100.00 de fondo" },
];

const INITIAL_INCIDENTS = [
  {
    id: "INC-2039",
    type: "Omisión de Escaneo",
    risk: "Alto" as const,
    cashier: "Carlos R.",
    time: "10:42 AM",
    status: "Pendiente",
    description: "Cajero pasó un artículo de botella sobre el escáner sin que el sistema registrara el código de barras.",
    scannedItems: [
      { qty: 1, name: "Papas Lays", price: 65.0 },
      { qty: 2, name: "Galletas Oreo", price: 45.0 }
    ]
  },
  {
    id: "INC-2038",
    type: "Anulación Sospechosa",
    risk: "Medio" as const,
    cashier: "Ana M.",
    time: "09:15 AM",
    status: "Revisado",
    description: "Cajero anuló 3 artículos de alto valor de manera consecutiva al final de la transacción.",
    scannedItems: [
      { qty: 1, name: "Whisky Black Label", price: 2500.0 }
    ]
  },
  {
    id: "INC-2037",
    type: "Cambio de Etiqueta",
    risk: "Alto" as const,
    cashier: "Carlos R.",
    time: "Ayer, 04:30 PM",
    status: "Pendiente",
    description: "Detección visual de artículo grande (Electrónica) registrado como artículo pequeño (Golosina).",
    scannedItems: [
      { qty: 1, name: "Chicle Trident", price: 25.0 }
    ]
  }
];

const Audit = () => {
  const [activeTab, setActiveTab] = useState<'AI' | 'SYSTEM'>('AI');
  const [incidents, setIncidents] = useState(INITIAL_INCIDENTS);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);

  const pendingCount = incidents.filter(i => i.status === "Pendiente").length;
  const highRiskCount = incidents.filter(i => i.risk === "Alto" && i.status === "Pendiente").length;

  const handleAction = (id: string, action: 'Revisado' | 'Falsa Alarma') => {
    setIncidents(incidents.map(inc => inc.id === id ? { ...inc, status: action } : inc));
    setSelectedIncident(null);
  };

  const filteredIncidents = incidents.filter(inc => {
    const matchSearch = inc.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        inc.cashier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFilter = filter === "Todos" || inc.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <main className="main-content">
      <TopNav title="Auditoría IA" />
      
      <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '0 24px' }}>
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <ShieldAlert size={28} color="var(--accent-primary)" /> Centro de Auditoría
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Registros del sistema y prevención de pérdidas por IA.</p>
          </div>
          
          <div style={{ display: 'flex', background: 'var(--bg-card)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
            <button 
              onClick={() => setActiveTab('AI')}
              style={{ padding: '8px 16px', borderRadius: '6px', background: activeTab === 'AI' ? 'var(--accent-primary)' : 'transparent', color: activeTab === 'AI' ? 'white' : 'var(--text-muted)', fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
            >
              <ShieldAlert size={16} /> Prevención IA
            </button>
            <button 
              onClick={() => setActiveTab('SYSTEM')}
              style={{ padding: '8px 16px', borderRadius: '6px', background: activeTab === 'SYSTEM' ? 'var(--accent-primary)' : 'transparent', color: activeTab === 'SYSTEM' ? 'white' : 'var(--text-muted)', fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
            >
              <Activity size={16} /> Registros del Sistema
            </button>
          </div>
        </div>

        {activeTab === 'AI' ? (
          <>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          <div className="card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={24} />
            </div>
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Alertas Críticas (Hoy)</p>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{highRiskCount}</h3>
            </div>
          </div>
          
          <div className="card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldAlert size={24} />
            </div>
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Pendientes de Revisión</p>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{pendingCount}</h3>
            </div>
          </div>

          <div className="card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Precisión de la IA</p>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 800 }}>94.2%</h3>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              className="input" 
              placeholder="Buscar por ID de incidente o cajero..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', paddingLeft: '44px' }}
            />
          </div>
          <select 
            className="input" 
            style={{ width: '200px' }}
            value={filter}
            onChange={e => setFilter(e.target.value)}
          >
            <option value="Todos">Todos los Estados</option>
            <option value="Pendiente">Pendientes</option>
            <option value="Revisado">Revisados</option>
            <option value="Falsa Alarma">Falsas Alarmas</option>
          </select>
        </div>

        {/* List of Incidents */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-app)', borderBottom: '1px solid var(--border-light)' }}>
                <th style={{ padding: '16px 20px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>INCIDENTE</th>
                <th style={{ padding: '16px 20px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>TIPO</th>
                <th style={{ padding: '16px 20px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>CAJERO</th>
                <th style={{ padding: '16px 20px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>FECHA/HORA</th>
                <th style={{ padding: '16px 20px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>ESTADO</th>
                <th style={{ padding: '16px 20px' }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No se encontraron incidentes con los filtros actuales.
                  </td>
                </tr>
              ) : (
                filteredIncidents.map(inc => (
                  <tr key={inc.id} style={{ borderBottom: '1px solid var(--border-light)', transition: '0.2s' }} className="hover:bg-[var(--bg-app)]">
                    <td style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-primary)' }}>{inc.id}</td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {inc.risk === 'Alto' ? <AlertTriangle size={16} color="var(--accent-danger)" /> : <ShieldAlert size={16} color="#F59E0B" />}
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{inc.type}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>{inc.cashier}</td>
                    <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>{inc.time}</td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ 
                        background: inc.status === 'Pendiente' ? 'rgba(239, 68, 68, 0.1)' : 
                                   inc.status === 'Revisado' ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-card)', 
                        color: inc.status === 'Pendiente' ? 'var(--accent-danger)' : 
                               inc.status === 'Revisado' ? 'var(--accent-success)' : 'var(--text-muted)',
                        padding: '4px 10px', borderRadius: '100px', fontSize: '0.8rem', fontWeight: 700,
                        border: inc.status === 'Falsa Alarma' ? '1px solid var(--border-medium)' : 'none'
                      }}>
                        {inc.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <button 
                        onClick={() => setSelectedIncident(inc)}
                        className="btn" 
                        style={{ background: 'var(--accent-primary)', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '0.85rem' }}
                      >
                        <Play size={14} fill="currentColor" /> Ver Evidencia
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
          </>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--bg-app)', borderBottom: '1px solid var(--border-light)' }}>
                  <th style={{ padding: '16px 20px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>HORA</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>USUARIO/ORIGEN</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>ACCIÓN</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>DETALLES</th>
                </tr>
              </thead>
              <tbody>
                {SYSTEM_LOGS.map(log => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--border-light)' }} className="hover:bg-[var(--bg-app)]">
                    <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={14} /> {log.time}
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-primary)' }}>{log.user}</td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ background: 'var(--bg-app)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <VideoEvidenceModal 
        isOpen={!!selectedIncident}
        incident={selectedIncident}
        onClose={() => setSelectedIncident(null)}
        onAction={handleAction}
      />
    </main>
  );
};

export default Audit;
