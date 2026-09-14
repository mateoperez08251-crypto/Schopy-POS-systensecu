import React, { useState, useEffect } from 'react';
import { check, Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { DownloadCloud, Info } from 'lucide-react';

export default function UpdateModal() {
  const [updateInfo, setUpdateInfo] = useState<Update | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [contentLength, setContentLength] = useState(0);
  const [downloaded, setDownloaded] = useState(0);

  useEffect(() => {
    async function checkForUpdates() {
      try {
        const update = await check();
        if (update) {
          setUpdateInfo(update);
        }
      } catch (e) {
        console.error("Error al buscar actualizaciones:", e);
      }
    }
    
    // Solo buscamos actualizaciones si estamos en entorno Tauri
    if ((window as any).__TAURI_INTERNALS__) {
      checkForUpdates();
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
      setIsDownloading(false);
    }
  };

  if (!updateInfo) return null;

  const progress = contentLength > 0 ? (downloaded / contentLength) * 100 : 0;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: '#1F2937', padding: '32px', borderRadius: '16px',
        width: '450px', color: 'white', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <DownloadCloud color="#3B82F6" />
          Nueva actualización disponible
        </h2>
        <p style={{ color: '#9CA3AF', marginBottom: '16px', lineHeight: '1.5' }}>
          Se ha encontrado una nueva versión de Schopy POS (<strong>v{updateInfo.version}</strong>).
          {updateInfo.body && <><br/><span style={{fontSize: '14px', color: '#D1D5DB'}}>Novedades: {updateInfo.body}</span></>}
        </p>
        
        {isDownloading ? (
          <div style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#9CA3AF' }}>
              <span>Descargando archivos...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: '#374151', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: '#3B82F6', transition: 'width 0.2s ease-out' }} />
            </div>
            <p style={{ textAlign: 'center', marginTop: '16px', color: '#6B7280', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Info size={14} /> La aplicación se reiniciará automáticamente.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button onClick={() => setUpdateInfo(null)} style={{ padding: '10px 16px', background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontWeight: 500 }}>
              Más tarde
            </button>
            <button onClick={handleUpdate} style={{ padding: '10px 20px', background: '#3B82F6', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
              Actualizar Ahora
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
