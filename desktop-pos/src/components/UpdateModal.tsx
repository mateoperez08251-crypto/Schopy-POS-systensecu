import React, { useState, useEffect } from 'react';
import { check, Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { DownloadCloud, Info } from 'lucide-react';

export default function UpdateModal() {
  const [updateInfo, setUpdateInfo] = useState<Update | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [contentLength, setContentLength] = useState(0);
  const [downloaded, setDownloaded] = useState(0);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkForUpdates() {
      try {
        const update = await check();
        if (update) setUpdateInfo(update);
      } catch (e) {
        // Sin internet o sin servidor no hay nada que ofrecer: no se interrumpe al cajero.
        console.error("Error al buscar actualizaciones:", e);
      }
    }
    
    // Solo buscamos actualizaciones si estamos en entorno Tauri nativo
    if (window.hasOwnProperty('__TAURI_INTERNALS__')) {
      checkForUpdates();
    } else {
      console.log("No estamos en Tauri, ignorando actualización.");
    }
  }, []);

  const handleUpdate = async () => {
    if (!updateInfo) return;
    setIsDownloading(true);
    try {
      await updateInfo.downloadAndInstall((event: any) => {
        switch (event.event) {
          case 'Started':
            setContentLength(event.data.contentLength || 0);
            break;
          case 'Progress':
            setDownloaded(prev => prev + event.data.chunkLength);
            break;
          case 'Finished':
            break;
        }
      });
      await relaunch();
    } catch (e) {
      console.error("Error al instalar la actualización:", e);
      setError("No se pudo instalar la actualización: " + String(e));
      setIsDownloading(false);
    }
  };

  if (!updateInfo) return null;

  const progress = contentLength > 0 ? (downloaded / contentLength) * 100 : 0;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px'
    }}>
      <aside style={{
        background: '#000', color: '#fff', padding: '24px', 
        borderRadius: '8px', width: '100%', maxWidth: '512px', 
        fontFamily: 'monospace', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
      }}>
        {error ? (
          <div>
            <p style={{ color: '#ef4444', margin: '0 0 16px 0' }}>$ install-update</p>
            <p style={{ color: '#ef4444', margin: '0 0 16px 0' }}>[ERROR] {error}</p>
            <button onClick={() => { setError(null); setUpdateInfo(null); }} style={{ 
              padding: '8px 16px', background: 'transparent', border: '1px solid #ef4444', 
              color: '#ef4444', cursor: 'pointer', fontFamily: 'monospace', borderRadius: '4px' 
            }}>
              [C] Cerrar
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' }}></div>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#eab308' }}></div>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#22c55e' }}></div>
          </div>
          <p style={{ fontSize: '14px', color: '#9CA3AF', margin: 0 }}>bash - schopy-update</p>
        </div>
        
        <div style={{ marginTop: '16px' }}>
          <p style={{ color: '#4ade80', margin: '0 0 8px 0' }}>$ check-updates</p>
          <p style={{ color: '#fff', margin: '0 0 4px 0' }}>{'>'} Nueva actualización disponible: v{updateInfo?.version}</p>
          {updateInfo?.body && <p style={{ color: '#9CA3AF', margin: '0 0 16px 0', fontSize: '14px' }}>{'>'} Novedades: {updateInfo.body}</p>}
          
          {isDownloading ? (
            <div style={{ marginTop: '24px' }}>
              <p style={{ color: '#4ade80', margin: '0 0 16px 0' }}>$ start-download</p>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px', marginTop: '16px' }}>
              <div className="washing-machine-loader"></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#9CA3AF' }}>
                <span>[=============================={'>'}]</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: '#374151', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: '#4ade80', transition: 'width 0.2s ease-out' }} />
              </div>
              <p style={{ color: '#eab308', fontSize: '13px', marginTop: '16px' }}>
                {'>'} La aplicación se reiniciará automáticamente al terminar...
              </p>
            </div>
          ) : (
            <div style={{ marginTop: '24px' }}>
              <p style={{ color: '#4ade80', margin: '0 0 16px 0' }}>$ prompt-user</p>
              <p style={{ color: '#fff', margin: '0 0 16px 0' }}>¿Deseas instalar la actualización ahora? (Y/n)</p>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button onClick={() => setUpdateInfo(null)} style={{ 
                  padding: '8px 16px', background: 'transparent', border: '1px solid #ef4444', 
                  color: '#ef4444', cursor: 'pointer', fontFamily: 'monospace', borderRadius: '4px' 
                }}>
                  [N] Cancelar
                </button>
                <button onClick={handleUpdate} style={{ 
                  padding: '8px 16px', background: '#4ade80', color: '#000', 
                  border: 'none', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 'bold', borderRadius: '4px' 
                }}>
                  [Y] Instalar
                </button>
              </div>
            </div>
          )}
        </div>
        </>
      )}
      </aside>
    </div>
  );
}
