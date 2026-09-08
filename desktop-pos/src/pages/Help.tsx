import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, BookOpen, ShoppingCart, Wallet, Settings, ShieldAlert, FileText } from 'lucide-react';

const Help = () => {
  const [openItem, setOpenItem] = useState<number | null>(0);

  const faqs = [
    {
      id: 0,
      icon: <ShoppingCart size={24} className="text-primary" />,
      question: '¿Cómo realizar una venta?',
      answer: 'Para realizar una venta, dirígete a la sección "Punto de Venta" desde el menú lateral. Utiliza el buscador principal para escanear el código de barras o escribir el nombre del producto. Puedes ajustar la cantidad usando los botones "+" o "-". Una vez tengas todos los productos, presiona el botón grande de "Cobrar" (o presiona la tecla Enter). Selecciona el método de pago, ingresa el monto recibido para calcular el cambio y confirma la venta. El ticket se generará automáticamente para imprimir.'
    },
    {
      id: 1,
      icon: <FileText size={24} className="text-primary" />,
      question: '¿Cómo reimprimir un ticket o cancelar una venta?',
      answer: 'Dirígete a "Ventas -> Historial". Allí encontrarás una lista con todas las transacciones realizadas. Puedes buscar por fecha o número de ticket. Al encontrar la venta deseada, haz clic sobre ella para ver los detalles, y desde ahí podrás Reimprimir el ticket o Anular la transacción si tienes permisos suficientes.'
    },
    {
      id: 2,
      icon: <Wallet size={24} className="text-primary" />,
      question: '¿Qué es y cómo hacer un Corte de Caja (Cierre Z)?',
      answer: 'El Corte de Caja es el proceso para finalizar tu turno. Ve a la sección "Caja & Cortes". El sistema te pedirá que cuentes e ingreses el dinero físico actual (sin contar la base inicial). Después de ingresarlo, presiona "Ejecutar Cierre Z". El sistema calculará si tienes un faltante, sobrante o si cuadra perfectamente, e imprimirá un reporte (Z) y lo guardará en la nube.'
    },
    {
      id: 3,
      icon: <Settings size={24} className="text-primary" />,
      question: '¿Cómo configurar los datos de mi empresa en los tickets?',
      answer: 'En la parte inferior del menú lateral, entra a "Configuración". Aquí podrás rellenar los "Datos de la Empresa" como el Nombre, RNC, Dirección, y Teléfono. También podrás cambiar el mensaje de despedida del ticket. Todo lo que cambies aquí se actualizará de forma instantánea en tus próximos reportes impresos (80mm) y PDFs.'
    },
    {
      id: 4,
      icon: <BookOpen size={24} className="text-primary" />,
      question: '¿Cómo ingresar productos al Inventario?',
      answer: 'Para agregar productos nuevos, dirígete a "Inventario" y usa el botón "+ Nuevo Producto". Llena los datos como Código, Nombre, Costo y Precio de Venta. Si deseas ingresar un lote grande de mercancía y actualizar el stock, se recomienda usar "Proveedores -> Recepción Mercancía" para llevar un control exacto de tus compras.'
    },
    {
      id: 5,
      icon: <ShieldAlert size={24} className="text-primary" />,
      question: '¿Cómo funciona la Auditoría Inteligente (IA)?',
      answer: 'Nuestra Inteligencia Artificial está monitoreando en segundo plano patrones inusuales (ej. ventas eliminadas, caja no cuadrada, cancelaciones nocturnas). Entrando a "Auditoría IA" y haciendo clic en "Analizar Patrones con IA", el sistema leerá los registros más recientes y te entregará un reporte avanzado, detectando posibles anomalías financieras en el punto de venta.'
    }
  ];

  return (
    <div style={{ padding: '32px', maxWidth: '800px', margin: '0 auto', animation: 'fadeIn 0.3s ease' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ width: '64px', height: '64px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', color: 'var(--accent-primary)' }}>
          <HelpCircle size={32} />
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 8px 0' }}>Centro de Ayuda</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto' }}>
          Aprende a dominar Schopy POS de forma rápida y sencilla con estas respuestas detalladas a preguntas frecuentes.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {faqs.map((faq) => (
          <div 
            key={faq.id} 
            className="card" 
            style={{ 
              borderRadius: '12px', 
              overflow: 'hidden',
              border: openItem === faq.id ? '2px solid var(--accent-primary)' : '1px solid var(--border-light)',
              transition: 'all 0.2s ease'
            }}
          >
            <div 
              onClick={() => setOpenItem(openItem === faq.id ? null : faq.id)}
              style={{ 
                padding: '20px 24px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                cursor: 'pointer',
                background: 'var(--bg-app)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ color: 'var(--accent-primary)' }}>{faq.icon}</div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{faq.question}</h3>
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>
                {openItem === faq.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </div>
            
            {openItem === faq.id && (
              <div style={{ padding: '0 24px 24px 64px', color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '0.95rem', animation: 'fadeIn 0.3s ease' }}>
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: '40px', padding: '24px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px dashed var(--border-medium)', textAlign: 'center' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 8px 0' }}>¿No encontraste tu respuesta?</h3>
        <p style={{ color: 'var(--text-secondary)', margin: '0 0 16px 0', fontSize: '0.9rem' }}>Nuestro equipo de soporte técnico está disponible para ayudarte.</p>
        <a 
          href="https://wa.me/18296324220" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="btn btn-primary" 
          style={{ padding: '10px 24px', display: 'inline-block', textDecoration: 'none' }}
        >
          Contactar Soporte Técnico
        </a>
      </div>
    </div>
  );
};

export default Help;
