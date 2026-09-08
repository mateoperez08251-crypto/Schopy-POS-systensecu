import React, { useRef, useEffect, useState } from 'react';
import '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { Camera, AlertTriangle } from 'lucide-react';

interface CameraFeedProps {
  onSuspiciousActivity?: (activityType: string, details: string) => void;
  isActive: boolean;
  isPOSActive: boolean;
}

const CameraFeed: React.FC<CameraFeedProps> = ({ onSuspiciousActivity, isActive, isPOSActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load the model
  useEffect(() => {
    const loadModel = async () => {
      try {
        console.log('Loading AI Model...');
        const loadedModel = await cocoSsd.load();
        setModel(loadedModel);
        console.log('AI Model Loaded successfully');
      } catch (err) {
        console.error('Error loading model:', err);
        setError('Error al cargar el modelo de IA');
      }
    };
    loadModel();
  }, []);

  // Setup Webcam
  useEffect(() => {
    if (!isActive) {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      return;
    }

    let isMounted = true;
    const enableCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' }, // Cambiar a 'environment' si es cámara trasera
          audio: false,
        });
        if (isMounted && videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Error accessing webcam:', err);
        setError('No se pudo acceder a la cámara');
      }
    };
    
    enableCamera();
    
    return () => {
      isMounted = false;
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isActive]);

  // Run predictions
  useEffect(() => {
    if (!isActive || !model || !videoRef.current) return;

    let animationFrameId: number;

    const detect = async () => {
      if (videoRef.current && videoRef.current.readyState === 4 && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        // Make canvas same size as video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const predictions = await model.detect(video);
        
        // Lógica de Prevención de Pérdidas (Loss Prevention)
        if (onSuspiciousActivity && predictions.length > 0) {
          const detectedClasses = predictions.map(p => p.class);
          
          // MOCK: Para pruebas sin entrenar el modelo, consideramos el "celular" como "Efectivo/Billetes"
          const isHandlingMoney = detectedClasses.includes('cell phone');
          
          if (isHandlingMoney && !isPOSActive) {
            // El cajero está tocando efectivo pero el sistema no está en modo de cobro
            onSuspiciousActivity(
              'POSIBLE ROBO O VENTA SIN FACTURAR', 
              'Se detectó manipulación de efectivo fuera de una transacción de cobro.'
            );
          }
        }

        // Draw predictions
        if (context) {
          context.clearRect(0, 0, canvas.width, canvas.height);
          
          predictions.forEach(prediction => {
            const [x, y, width, height] = prediction.bbox;
            // Draw box
            context.strokeStyle = '#EF4444'; // Red box
            context.lineWidth = 2;
            context.strokeRect(x, y, width, height);
            
            // Draw label
            context.fillStyle = '#EF4444';
            context.font = '16px Arial';
            context.fillText(
              `${prediction.class} (${Math.round(prediction.score * 100)}%)`,
              x,
              y > 20 ? y - 5 : y + 20
            );
          });
        }
      }
      
      animationFrameId = requestAnimationFrame(detect);
    };

    videoRef.current.addEventListener('loadeddata', detect);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (videoRef.current) videoRef.current.removeEventListener('loadeddata', detect);
    };
  }, [isActive, model, onSuspiciousActivity, isPOSActive]);

  if (!isActive) return null;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000', borderRadius: '12px', overflow: 'hidden' }}>
      {error ? (
        <div style={{ padding: '20px', color: 'var(--accent-danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle /> {error}
        </div>
      ) : (
        <>
          <video 
            ref={videoRef}
            autoPlay 
            playsInline
            muted
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <canvas
            ref={canvasRef}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
          />
          {!model && (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white', background: 'rgba(0,0,0,0.5)', padding: '8px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="spinner" style={{ width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }}></span>
              Cargando IA...
            </div>
          )}
          <div style={{ position: 'absolute', bottom: '12px', left: '12px', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: '4px', color: 'white', fontSize: '0.8rem' }}>
            <Camera size={14} /> Detección de Objetos Activa
          </div>
        </>
      )}
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default CameraFeed;
