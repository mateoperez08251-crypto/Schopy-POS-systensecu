import React, { useState, useEffect } from 'react';
import { X, Play, Pause, Maximize, AlertTriangle, ShieldAlert, CheckCircle2, Video } from 'lucide-react';

interface Incident {
  id: string;
  type: string;
  risk: 'Alto' | 'Medio';
  cashier: string;
  time: string;
  status: string;
  description: string;
  scannedItems: any[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  incident: Incident | null;
  onAction: (id: string, action: 'Revisado' | 'Falsa Alarma') => void;
}

const VideoEvidenceModal = ({ isOpen, onClose, incident, onAction }: Props) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            setIsPlaying(false);
            return 100;
          }
          return p + 2; // 5 seconds roughly (100 / 50 = 2% per 100ms)
        });
      }, 100);
    } else if (progress >= 100) {
      setProgress(0);
    }
    return () => clearInterval(interval);
  }, [isPlaying, progress]);

  if (!isOpen || !incident) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '20px'
    }}>
      <div className="animate-pop" style={{
        background: 'var(--bg-card)', borderRadius: '16px',
        width: '100%', maxWidth: '960px', maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: incident.risk === 'Alto' ? 'var(--accent-danger)' : '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <ShieldAlert size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>Evidencia de Incidente: {incident.id}</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{incident.type} • {incident.time}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} className="hover:text-primary">
            <X size={24} />
          </button>
        </div>

        {/* Body Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', overflow: 'hidden', flex: 1 }}>
          
          {/* Left: Video Player */}
          <div style={{ background: '#000', position: 'relative', display: 'flex', flexDirection: 'column' }}>
            {/* Cam Overlay */}
            <div style={{ position: 'absolute', top: 16, left: 16, color: 'white', textShadow: '0 1px 4px rgba(0,0,0,0.8)', fontSize: '0.85rem', fontWeight: 600, zIndex: 10 }}>
              🔴 REC • CAM-01 CAJA PRINCIPAL
              <div style={{ marginTop: '4px', fontSize: '0.75rem', fontWeight: 400, opacity: 0.8 }}>
                {new Date().toLocaleDateString()} {incident.time}
              </div>
            </div>

            {/* Video Mocking Area */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <Video size={64} color="rgba(255,255,255,0.1)" />
              {/* AI Bounding Box (simulated when playing) */}
              {progress > 20 && progress < 80 && (
                <div style={{ 
                  position: 'absolute', top: '40%', left: '45%', width: '120px', height: '140px',
                  border: '2px solid #EF4444', backgroundColor: 'rgba(239,68,68,0.1)',
                  boxShadow: '0 0 15px rgba(239,68,68,0.5)', borderRadius: '8px',
                  display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start'
                }}>
                  <div style={{ background: '#EF4444', color: 'white', fontSize: '0.65rem', padding: '2px 6px', fontWeight: 700, borderBottomRightRadius: '8px' }}>
                    OBJETO NO DETECTADO EN POS (98%)
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div style={{ padding: '16px', background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'white', color: 'black', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  {isPlaying ? <Pause size={18} fill="black" /> : <Play size={18} fill="black" style={{ marginLeft: '2px' }} />}
                </button>
                <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.3)', borderRadius: '3px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: `${progress}%`, background: '#EF4444', transition: 'width 0.1s linear' }} />
                </div>
                <div style={{ color: 'white', fontSize: '0.8rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                  00:0{Math.floor((progress / 100) * 5)} / 00:05
                </div>
                <Maximize size={18} color="white" style={{ cursor: 'pointer', opacity: 0.8 }} />
              </div>
            </div>
          </div>

          {/* Right: Receipt & Details */}
          <div style={{ background: 'var(--bg-app)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto' }}>
            <div>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Análisis de Inteligencia Artificial
              </h3>
              <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-light)', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <AlertTriangle size={20} color="var(--accent-danger)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '4px' }}>{incident.description}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>El sistema de visión por computadora detectó movimiento de artículos en el área de escáner sin un registro correspondiente en el ticket de venta.</p>
                </div>
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Ticket de Venta (Tiempo Real)
              </h3>
              <div style={{ background: 'white', color: 'black', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', fontFamily: 'monospace' }}>
                <div style={{ textAlign: 'center', borderBottom: '1px dashed #ccc', paddingBottom: '12px', marginBottom: '12px' }}>
                  <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>SCHOPY MARKET</p>
                  <p style={{ fontSize: '0.85rem' }}>Cajero: {incident.cashier}</p>
                  <p style={{ fontSize: '0.85rem' }}>Hora: {incident.time}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {incident.scannedItems.length === 0 ? (
                    <p style={{ fontSize: '0.85rem', fontStyle: 'italic', textAlign: 'center' }}>[Sin artículos escaneados en este bloque]</p>
                  ) : (
                    incident.scannedItems.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span>{item.qty}x {item.name}</span>
                        <span>${item.price.toFixed(2)}</span>
                      </div>
                    ))
                  )}
                </div>
                <div style={{ borderTop: '1px dashed #ccc', paddingTop: '12px', marginTop: '12px', display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                  <span>TOTAL ESCANEADO</span>
                  <span>
                    ${incident.scannedItems.reduce((acc, curr) => acc + (curr.qty * curr.price), 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: 'var(--bg-card)' }}>
          <button onClick={() => onAction(incident.id, 'Falsa Alarma')} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <X size={18} /> Falsa Alarma
          </button>
          <button onClick={() => onAction(incident.id, 'Revisado')} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} /> Marcar como Revisado
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoEvidenceModal;
