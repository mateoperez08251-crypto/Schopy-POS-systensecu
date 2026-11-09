import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Barcode,
  Printer,
  RefreshCw,
  Plus,
  Minus,
  Trash2,
  Search,
  Scissors,
  Check,
  AlertTriangle,
  Save,
  PackagePlus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBusiness } from '../context/BusinessContext';
import { updateInventoryItem } from '../firebase/inventoryService';
import { smartSearch } from '../utils/searchEngine';
import {
  BarcodeFormat,
  BarcodeLabelItem,
  ThermalPrintSettings,
  PAPER_LIMIT_PRESETS,
  DENSITY_CONFIG,
  PaperLimitPreset,
  ThermalLabelDensity,
  ThermalPaperWidth,
  generateUniqueBarcode,
  validateAndNormalizeBarcode,
  renderBarcodeSvgMarkup,
  calculateThermalStripMetrics,
  printThermalBarcodesIsolated,
} from '../utils/barcodeUtils';

interface BarcodeGeneratorProps {
  inventory: any[];
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const STORAGE_KEY_SETTINGS = 'schopy_barcode_thermal_settings';

const DEFAULT_SETTINGS: ThermalPrintSettings = {
  paperWidth: 80,
  twoColumnsOn80mm: true,
  density: 'compact',
  paperLimit: 'short-strip',
  showProductName: true,
  showPrice: false,
  showCutGuides: true,
  currencySymbol: '$',
};

const BarcodeGenerator: React.FC<BarcodeGeneratorProps> = ({ inventory, showToast }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userData } = useAuth();
  const { config } = useBusiness();
  const productWord = config.labels.product.toLowerCase();
  const currencySymbol = userData?.currency || '$';
  const initialProduct = (location.state as { product?: any } | null)?.product ?? null;

  const goBack = () => navigate('/inventory');

  const onAssignCodeToProduct = async (productId: string, newCode: string, updatedName?: string) => {
    const cleanCode = (newCode || '').trim();
    const duplicate = inventory.find(p => (p.code || '').trim() === cleanCode && p.id !== productId);
    if (duplicate) {
      showToast?.(`El código "${cleanCode}" ya pertenece a: ${duplicate.name}`, 'error');
      return false;
    }
    try {
      const updates: Record<string, any> = { code: cleanCode };
      if (updatedName && updatedName.trim()) {
        updates.name = updatedName.trim();
      }
      await updateInventoryItem(productId, updates);
      showToast?.('Código de barras y nombre guardados en el producto', 'success');
      return true;
    } catch (error) {
      console.error(error);
      showToast?.('Error al guardar el código en el producto', 'error');
      return false;
    }
  };

  const onCreateNewProductWithBarcode = (draft: { name: string; code: string; price?: number }) => {
    navigate('/inventory', { state: { newProductDraft: draft } });
  };

  // Configuración térmica persistente (aislada solo para esta pantalla)
  const [settings, setSettings] = useState<ThermalPrintSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved), currencySymbol };
      }
    } catch {
      // ignore
    }
    return { ...DEFAULT_SETTINGS, currencySymbol };
  });

  // Estados del formulario de creación actual
  const [searchQuery, setSearchQuery] = useState('');
  const [linkedProduct, setLinkedProduct] = useState<any | null>(null);
  const [productName, setProductName] = useState('');
  const [barcodeValue, setBarcodeValue] = useState('');
  const [barcodeFormat, setBarcodeFormat] = useState<BarcodeFormat>('CODE128');
  const [productPrice, setProductPrice] = useState<string>('');
  const [copies, setCopies] = useState<number>(1);
  const [isSavingCode, setIsSavingCode] = useState(false);

  // Cola opcional de etiquetas para imprimir varias referencias en una sola tira corta
  const [stripQueue, setStripQueue] = useState<BarcodeLabelItem[]>([]);

  useEffect(() => {
    setSettings((prev) => ({ ...prev, currencySymbol }));
  }, [currencySymbol]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  const allExistingCodes = useMemo(() => {
    const invCodes = inventory.map((p) => String(p.code || '').trim()).filter(Boolean);
    const queueCodes = stripQueue.map((q) => q.code);
    return [...invCodes, ...queueCodes];
  }, [inventory, stripQueue]);

  // Inicializar al entrar, o al llegar desde otro producto
  useEffect(() => {
    setSearchQuery('');
    setStripQueue([]);
    setCopies(1);

    if (initialProduct) {
      setLinkedProduct(initialProduct);
      setProductName(initialProduct.name || '');
      const existingCode = String(initialProduct.code || '').trim();
      if (existingCode) {
        setBarcodeValue(existingCode);
      } else {
        const generated = generateUniqueBarcode(
          inventory.map((p) => String(p.code || '')),
          'CODE128'
        );
        setBarcodeValue(generated);
      }
      setBarcodeFormat('CODE128');
      setProductPrice(
        initialProduct.price !== undefined && initialProduct.price !== ''
          ? String(initialProduct.price)
          : ''
      );
    } else {
      setLinkedProduct(null);
      setProductName('');
      const generated = generateUniqueBarcode(
        inventory.map((p) => String(p.code || '')),
        'CODE128'
      );
      setBarcodeValue(generated);
      setBarcodeFormat('CODE128');
      setProductPrice('');
    }
  }, [location.key]);

  // Búsqueda rápida de productos existentes del inventario
  const searchResults = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return [];
    return smartSearch(inventory, q, ['name', 'code', 'referenceCode', 'category']).slice(0, 6);
  }, [inventory, searchQuery]);

  // Validación del código actual
  const validation = useMemo(
    () => validateAndNormalizeBarcode(barcodeValue, barcodeFormat),
    [barcodeValue, barcodeFormat]
  );

  // Detectar si el código colisiona con otro producto distinto en el inventario
  const duplicateOwner = useMemo(() => {
    const clean = validation.normalized.trim();
    if (!clean) return null;
    return inventory.find(
      (p) =>
        String(p.code || '').trim().toLowerCase() === clean.toLowerCase() &&
        p.id !== linkedProduct?.id
    );
  }, [inventory, validation.normalized, linkedProduct]);

  // Etiquetas efectivas a imprimir (si hay cola usa la cola; si no, usa el formulario actual)
  const activeItemsToPrint: BarcodeLabelItem[] = useMemo(() => {
    if (stripQueue.length > 0) {
      return stripQueue;
    }
    if (!validation.isValid || !validation.normalized) {
      return [];
    }
    const parsedPrice = parseFloat(productPrice);
    return [
      {
        uid: 'current-draft',
        productId: linkedProduct?.id,
        name: productName.trim() || 'Producto sin nombre',
        code: validation.normalized,
        format: barcodeFormat,
        price: !isNaN(parsedPrice) && parsedPrice > 0 ? parsedPrice : undefined,
        copies: Math.max(1, copies),
      },
    ];
  }, [stripQueue, validation, productName, barcodeFormat, productPrice, copies, linkedProduct]);

  const rawRequestedLabels = useMemo(
    () => activeItemsToPrint.reduce((sum, item) => sum + Math.max(1, item.copies), 0),
    [activeItemsToPrint]
  );

  // Cálculo del límite de hoja exclusivo de esta pantalla
  const stripMetrics = useMemo(
    () => calculateThermalStripMetrics(rawRequestedLabels, settings),
    [rawRequestedLabels, settings]
  );

  // Ajustar automáticamente copias si el usuario reduce el límite máximo de hoja
  useEffect(() => {
    if (stripQueue.length === 0 && copies > stripMetrics.maxLabelsAllowed) {
      setCopies(stripMetrics.maxLabelsAllowed);
    }
  }, [stripMetrics.maxLabelsAllowed, stripQueue.length, copies]);

  // Lista plana de celdas para renderizar en la vista previa térmica real
  const previewCells = useMemo(() => {
    const densityCfg = DENSITY_CONFIG[settings.density];
    const effectiveCols =
      settings.paperWidth === 80 && settings.twoColumnsOn80mm && rawRequestedLabels > 1 ? 2 : 1;

    const cells: Array<{
      key: string;
      name: string;
      code: string;
      price?: number;
      svgMarkup: string | null;
    }> = [];

    for (const item of activeItemsToPrint) {
      if (cells.length >= stripMetrics.maxLabelsAllowed) break;
      const svgMarkup = renderBarcodeSvgMarkup(item.code, item.format, {
        barWidth: effectiveCols === 2 ? 1.35 : settings.paperWidth === 58 ? 1.5 : 1.85,
        barHeight: densityCfg.barHeightPx,
        fontSize: densityCfg.fontSizeCodePx,
        displayValue: true,
      });

      for (let i = 0; i < item.copies && cells.length < stripMetrics.maxLabelsAllowed; i++) {
        cells.push({
          key: `${item.uid}-${i}`,
          name: item.name,
          code: item.code,
          price: item.price,
          svgMarkup,
        });
      }
    }
    return cells;
  }, [activeItemsToPrint, settings, stripMetrics]);


  const handleSelectInventoryProduct = (prod: any) => {
    setLinkedProduct(prod);
    setSearchQuery('');
    setProductName(prod.name || '');
    const currentCode = String(prod.code || '').trim();
    if (currentCode) {
      setBarcodeValue(currentCode);
      setBarcodeFormat('CODE128');
    } else {
      const generated = generateUniqueBarcode(allExistingCodes, barcodeFormat);
      setBarcodeValue(generated);
      if (showToast) {
        showToast('Este producto no tenía código; se generó uno nuevo listo para asignar.', 'info');
      }
    }
    setProductPrice(prod.price !== undefined && prod.price !== '' ? String(prod.price) : '');
  };

  const handleGenerateNewCode = (targetFormat: BarcodeFormat = barcodeFormat) => {
    const newCode = generateUniqueBarcode(allExistingCodes, targetFormat);
    setBarcodeValue(newCode);
  };

  const handleFormatChange = (newFmt: BarcodeFormat) => {
    setBarcodeFormat(newFmt);
    const check = validateAndNormalizeBarcode(barcodeValue, newFmt);
    if (!check.isValid) {
      setBarcodeValue(generateUniqueBarcode(allExistingCodes, newFmt));
    } else {
      setBarcodeValue(check.normalized);
    }
  };

  const handleAddToStripQueue = () => {
    if (!productName.trim()) {
      showToast?.('Escribe el nombre del producto para la etiqueta.', 'error');
      return;
    }
    if (!validation.isValid || !validation.normalized) {
      showToast?.(validation.error || 'El código de barras no es válido.', 'error');
      return;
    }

    const currentQueuedTotal = stripQueue.reduce((acc, i) => acc + i.copies, 0);
    const available = stripMetrics.maxLabelsAllowed - currentQueuedTotal;
    if (available <= 0) {
      showToast?.(
        `Alcanzaste el límite de hoja (${PAPER_LIMIT_PRESETS[settings.paperLimit].label}). Imprime esta tira o amplía el tope.`,
        'info'
      );
      return;
    }

    const copiesToAdd = Math.min(Math.max(1, copies), available);
    const parsedPrice = parseFloat(productPrice);

    setStripQueue((prev) => [
      ...prev,
      {
        uid: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        productId: linkedProduct?.id,
        name: productName.trim(),
        code: validation.normalized,
        format: barcodeFormat,
        price: !isNaN(parsedPrice) && parsedPrice > 0 ? parsedPrice : undefined,
        copies: copiesToAdd,
      },
    ]);

    if (copiesToAdd < copies) {
      showToast?.(
        `Se agregaron ${copiesToAdd} etiqueta(s) para respetar el límite de ahorro de hoja.`,
        'info'
      );
    }

    // Preparar siguiente código limpio por si desea agregar otro producto
    setLinkedProduct(null);
    setProductName('');
    setProductPrice('');
    setCopies(1);
    setBarcodeValue(
      generateUniqueBarcode([...allExistingCodes, validation.normalized], barcodeFormat)
    );
  };

  const handleUpdateQueueCopies = (uid: string, delta: number) => {
    setStripQueue((prev) => {
      const totalExcept = prev
        .filter((i) => i.uid !== uid)
        .reduce((s, i) => s + i.copies, 0);
      const maxForThis = Math.max(1, stripMetrics.maxLabelsAllowed - totalExcept);

      return prev.map((item) => {
        if (item.uid !== uid) return item;
        const next = Math.min(maxForThis, Math.max(1, item.copies + delta));
        return { ...item, copies: next };
      });
    });
  };

  const handleRemoveFromQueue = (uid: string) => {
    setStripQueue((prev) => prev.filter((i) => i.uid !== uid));
  };

  const handleAssignCodeToLinkedProduct = async () => {
    if (!linkedProduct?.id || !onAssignCodeToProduct) return;
    if (!validation.isValid || !validation.normalized) {
      showToast?.(validation.error || 'Código inválido', 'error');
      return;
    }
    if (duplicateOwner) {
      showToast?.(`Ese código ya pertenece a "${duplicateOwner.name}".`, 'error');
      return;
    }

    setIsSavingCode(true);
    try {
      const ok = await onAssignCodeToProduct(
        linkedProduct.id,
        validation.normalized,
        productName.trim() || linkedProduct.name
      );
      if (ok) {
        setLinkedProduct((prev: any) =>
          prev
            ? {
                ...prev,
                code: validation.normalized,
                name: productName.trim() || prev.name,
              }
            : null
        );
      }
    } finally {
      setIsSavingCode(false);
    }
  };

  const handlePrint = () => {
    if (stripQueue.length === 0 && !productName.trim() && settings.showProductName) {
      showToast?.('Añade el nombre del producto antes de imprimir la etiqueta.', 'error');
      return;
    }
    if (activeItemsToPrint.length === 0) {
      showToast?.(validation.error || 'Genera o escribe un código válido primero.', 'error');
      return;
    }

    // Efectivo: si solo hay 1 etiqueta en total, en 80mm usamos 1 columna centrada o 2 según prefiera;
    // mantenemos la configuración seleccionada por el usuario.
    const effectiveSettings: ThermalPrintSettings = {
      ...settings,
      twoColumnsOn80mm:
        settings.paperWidth === 80 && settings.twoColumnsOn80mm && rawRequestedLabels > 1,
    };

    const res = printThermalBarcodesIsolated(activeItemsToPrint, effectiveSettings);
    if (!res.success) {
      showToast?.(res.error || 'No se pudo imprimir.', 'error');
    } else {
      showToast?.(
        `Enviando ${res.printedCount} etiqueta(s) en formato térmico compacto (~${stripMetrics.estimatedHeightCm} cm).`,
        'success'
      );
    }
  };

  const linkedCodeChanged =
    linkedProduct &&
    validation.isValid &&
    (String(linkedProduct.code || '').trim() !== validation.normalized ||
      (productName.trim() && productName.trim() !== linkedProduct.name));

  const queuedTotalCount = stripQueue.reduce((s, i) => s + i.copies, 0);
  const maxCurrentCopies =
    stripQueue.length > 0
      ? Math.max(1, stripMetrics.maxLabelsAllowed - queuedTotalCount)
      : stripMetrics.maxLabelsAllowed;

  const usagePercent = Math.min(
    100,
    Math.round((stripMetrics.estimatedHeightMm / stripMetrics.maxAllowedHeightMm) * 100)
  );

  const previewGridCols =
    settings.paperWidth === 80 && settings.twoColumnsOn80mm && previewCells.length > 1 ? 2 : 1;

  return (
    <div style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div
        className="card"
        style={{
          width: '100%',
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
        }}
      >
        {/* HEADER */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-medium)',
            background: 'var(--bg-app)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'var(--accent-primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-primary)',
                flexShrink: 0,
              }}
            >
              <Barcode size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                Creador de Códigos de Barra con Nombre
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Adaptado para impresoras térmicas de facturas (58mm / 80mm) · Ahorro de papel exclusivo en esta pantalla
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-outline"
            onClick={goBack}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}
          >
            <ArrowLeft size={18} /> Volver a Inventario
          </button>
        </div>

        {/* BODY */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.15fr 0.85fr',
            gap: '0',
            flex: 1,
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          {/* COLUMNA IZQUIERDA: CONTROLES */}
          <div
            style={{
              padding: '20px 24px',
              overflowY: 'auto',
              borderRight: '1px solid var(--border-medium)',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
            }}
          >
            {/* 1. Buscador opcional para cargar del inventario */}
            <div style={{ position: 'relative' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  marginBottom: '6px',
                }}
              >
                1. Cargar producto del inventario (Opcional) o escribir libre abajo
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'var(--bg-app)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  padding: '8px 12px',
                  gap: '8px',
                }}
              >
                <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Buscar ${productWord} existente para traer su nombre y código...`}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    width: '100%',
                    outline: 'none',
                    fontSize: '0.88rem',
                    color: 'var(--text-primary)',
                  }}
                />
                {linkedProduct && (
                  <button
                    type="button"
                    onClick={() => {
                      setLinkedProduct(null);
                      setProductName('');
                      setProductPrice('');
                      handleGenerateNewCode();
                    }}
                    style={{
                      background: 'var(--accent-primary-light)',
                      color: 'var(--accent-primary)',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                    title="Desvincular y crear etiqueta libre"
                  >
                    Nuevo libre ×
                  </button>
                )}
              </div>

              {/* Resultados desplegables */}
              {searchResults.length > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    right: 0,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    zIndex: 30,
                    maxHeight: '210px',
                    overflowY: 'auto',
                  }}
                >
                  {searchResults.map((prod) => (
                    <div
                      key={prod.id}
                      onClick={() => handleSelectInventoryProduct(prod)}
                      style={{
                        padding: '10px 14px',
                        borderBottom: '1px solid var(--border-light)',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{prod.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {prod.code ? `Cód: ${prod.code}` : 'Sin código de barras'} · Stock:{' '}
                          {prod.stock ?? 0}
                        </div>
                      </div>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          color: 'var(--accent-primary)',
                        }}
                      >
                        {currencySymbol}
                        {Number(prod.price || 0).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Nombre del Producto + Código de Barras */}
            <div
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-app)',
                border: '1px solid var(--border-medium)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              <div>
                <div className="flex-between" style={{ marginBottom: '6px' }}>
                  <label
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                    }}
                  >
                    Nombre del Producto en la Etiqueta *
                  </label>
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={settings.showProductName}
                      onChange={(e) =>
                        setSettings((s) => ({ ...s, showProductName: e.target.checked }))
                      }
                      style={{ accentColor: 'var(--accent-primary)' }}
                    />
                    Imprimir nombre
                  </label>
                </div>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Ej. Pastillas de Freno Toyota Corolla 2019"
                  maxLength={60}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-medium)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    outline: 'none',
                  }}
                />
              </div>

              {/* Código + Formato + Botón Autogenerar */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 145px', gap: '10px' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: 'var(--text-secondary)',
                      marginBottom: '6px',
                    }}
                  >
                    Código de Barras *
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="text"
                      value={barcodeValue}
                      onChange={(e) => setBarcodeValue(e.target.value)}
                      placeholder="Ej. 74829104"
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-sm)',
                        border: `1px solid ${
                          !validation.isValid || duplicateOwner
                            ? 'var(--accent-danger)'
                            : 'var(--border-medium)'
                        }`,
                        background: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        outline: 'none',
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => handleGenerateNewCode()}
                      style={{
                        padding: '0 12px',
                        whiteSpace: 'nowrap',
                        fontWeight: 700,
                        color: 'var(--accent-primary)',
                        borderColor: 'var(--accent-primary)',
                      }}
                      title="Generar código único automáticamente"
                    >
                      <RefreshCw size={15} /> Generar
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: 'var(--text-secondary)',
                      marginBottom: '6px',
                    }}
                  >
                    Estándar
                  </label>
                  <select
                    value={barcodeFormat}
                    onChange={(e) => handleFormatChange(e.target.value as BarcodeFormat)}
                    style={{
                      width: '100%',
                      padding: '10px 10px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-medium)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      fontWeight: 600,
                      outline: 'none',
                    }}
                  >
                    <option value="CODE128">CODE128 (Ideal)</option>
                    <option value="EAN13">EAN-13</option>
                    <option value="CODE39">CODE39</option>
                  </select>
                </div>
              </div>

              {/* Mensajes de validación o colisión */}
              {!validation.isValid && validation.error && (
                <div
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--accent-danger)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: 600,
                  }}
                >
                  <AlertTriangle size={14} /> {validation.error}
                </div>
              )}

              {validation.helperNote && (
                <div style={{ fontSize: '0.76rem', color: 'var(--accent-success)', fontWeight: 600 }}>
                  {validation.helperNote}
                </div>
              )}

              {duplicateOwner && (
                <div
                  style={{
                    fontSize: '0.78rem',
                    color: '#f59e0b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: 600,
                  }}
                >
                  <AlertTriangle size={14} /> Atención: este código ya lo usa "{duplicateOwner.name}".
                </div>
              )}

              {/* Precio Opcional + Cantidad de Copias + Botón Añadir a Tira */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '12px',
                  alignItems: 'flex-end',
                  paddingTop: '6px',
                  borderTop: '1px dashed var(--border-medium)',
                }}
              >
                <div style={{ flex: '1 1 130px' }}>
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      marginBottom: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={settings.showPrice}
                      onChange={(e) =>
                        setSettings((s) => ({ ...s, showPrice: e.target.checked }))
                      }
                      style={{ accentColor: 'var(--accent-primary)' }}
                    />
                    Mostrar Precio ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    disabled={!settings.showPrice}
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                    onWheel={(e) => e.currentTarget.blur()}
                    placeholder="0.00"
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-medium)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      opacity: settings.showPrice ? 1 : 0.5,
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      marginBottom: '6px',
                    }}
                  >
                    Copias (Máx. {maxCurrentCopies})
                  </label>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      border: '1px solid var(--border-medium)',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-card)',
                      height: '36px',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setCopies((c) => Math.max(1, c - 1))}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        padding: '0 10px',
                        cursor: 'pointer',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <Minus size={14} />
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={maxCurrentCopies}
                      value={copies}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 1;
                        setCopies(Math.min(maxCurrentCopies, Math.max(1, val)));
                      }}
                      onWheel={(e) => e.currentTarget.blur()}
                      style={{
                        width: '44px',
                        textAlign: 'center',
                        border: 'none',
                        background: 'transparent',
                        fontWeight: 800,
                        color: 'var(--text-primary)',
                        outline: 'none',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setCopies((c) => Math.min(maxCurrentCopies, c + 1))}
                      disabled={copies >= maxCurrentCopies}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        padding: '0 10px',
                        cursor: copies >= maxCurrentCopies ? 'not-allowed' : 'pointer',
                        opacity: copies >= maxCurrentCopies ? 0.35 : 1,
                        color: 'var(--text-primary)',
                      }}
                      title={
                        copies >= maxCurrentCopies
                          ? 'Límite de ahorro de hoja alcanzado'
                          : 'Aumentar copias'
                      }
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleAddToStripQueue}
                  disabled={stripMetrics.remainingLabelsCapacity <= 0 && stripQueue.length > 0}
                  style={{
                    height: '36px',
                    padding: '0 12px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                  }}
                  title="Combinar varios productos distintos en la misma tira corta"
                >
                  <Plus size={15} /> Añadir a tira
                </button>
              </div>

              {/* Acciones rápidas de vinculación con inventario */}
              {linkedCodeChanged && !duplicateOwner && (
                <button
                  type="button"
                  onClick={handleAssignCodeToLinkedProduct}
                  disabled={isSavingCode}
                  className="btn btn-outline"
                  style={{
                    width: '100%',
                    borderColor: 'var(--accent-success)',
                    color: 'var(--accent-success)',
                    fontWeight: 700,
                    padding: '8px 12px',
                  }}
                >
                  <Save size={15} />{' '}
                  {isSavingCode
                    ? 'Guardando en inventario...'
                    : `Guardar código "${validation.normalized}" en este producto`}
                </button>
              )}

              {!linkedProduct &&
                productName.trim() &&
                validation.isValid &&
                !duplicateOwner &&
                onCreateNewProductWithBarcode && (
                  <button
                    type="button"
                    onClick={() => {
                      const p = parseFloat(productPrice);
                      onCreateNewProductWithBarcode({
                        name: productName.trim(),
                        code: validation.normalized,
                        price: !isNaN(p) && p > 0 ? p : undefined,
                      });
                    }}
                    className="btn btn-outline"
                    style={{
                      width: '100%',
                      fontSize: '0.8rem',
                      padding: '8px 12px',
                      fontWeight: 600,
                    }}
                  >
                    <PackagePlus size={15} /> Registrar también en Inventario con este código
                  </button>
                )}
            </div>

            {/* 3. Configuración exclusiva de impresora térmica de facturas y límite de hoja */}
            <div
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-medium)',
                background: 'var(--bg-card)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div className="flex-between">
                <span style={{ fontSize: '0.86rem', fontWeight: 800 }}>
                  Control de Papel Térmico (Solo para esta Pantalla)
                </span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    padding: '2px 8px',
                    borderRadius: '99px',
                    background: 'rgba(16, 185, 129, 0.12)',
                    color: 'var(--accent-success)',
                    fontWeight: 700,
                  }}
                >
                  Facturas POS intactas
                </span>
              </div>

              {/* Selector de Límite Estricto de Hoja */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: 'var(--text-secondary)',
                    marginBottom: '6px',
                  }}
                >
                  Límite máximo de hoja por impresión
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {(Object.keys(PAPER_LIMIT_PRESETS) as PaperLimitPreset[]).map((presetKey) => {
                    const preset = PAPER_LIMIT_PRESETS[presetKey];
                    const active = settings.paperLimit === presetKey;
                    return (
                      <button
                        key={presetKey}
                        type="button"
                        onClick={() => setSettings((s) => ({ ...s, paperLimit: presetKey }))}
                        style={{
                          padding: '8px 8px',
                          borderRadius: '8px',
                          border: `1px solid ${
                            active ? 'var(--accent-primary)' : 'var(--border-medium)'
                          }`,
                          background: active ? 'var(--accent-primary-light)' : 'var(--bg-app)',
                          color: active ? 'var(--accent-primary)' : 'var(--text-primary)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          textAlign: 'center',
                        }}
                        title={preset.description}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ancho de Rollo + Tamaño de Etiqueta */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: 'var(--text-secondary)',
                      marginBottom: '6px',
                    }}
                  >
                    Ancho Impresora de Factura
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {([80, 58] as ThermalPaperWidth[]).map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setSettings((s) => ({ ...s, paperWidth: w }))}
                        style={{
                          flex: 1,
                          padding: '8px',
                          borderRadius: '8px',
                          border: `1px solid ${
                            settings.paperWidth === w
                              ? 'var(--accent-primary)'
                              : 'var(--border-medium)'
                          }`,
                          background:
                            settings.paperWidth === w
                              ? 'var(--accent-primary-light)'
                              : 'var(--bg-app)',
                          color:
                            settings.paperWidth === w
                              ? 'var(--accent-primary)'
                              : 'var(--text-primary)',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                        }}
                      >
                        {w} mm
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: 'var(--text-secondary)',
                      marginBottom: '6px',
                    }}
                  >
                    Altura de Etiqueta
                  </label>
                  <select
                    value={settings.density}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        density: e.target.value as ThermalLabelDensity,
                      }))
                    }
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-medium)',
                      background: 'var(--bg-app)',
                      color: 'var(--text-primary)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      outline: 'none',
                    }}
                  >
                    {(Object.keys(DENSITY_CONFIG) as ThermalLabelDensity[]).map((d) => (
                      <option key={d} value={d}>
                        {DENSITY_CONFIG[d].label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Opciones extra de ahorro y corte */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '16px',
                  paddingTop: '4px',
                }}
              >
                {settings.paperWidth === 80 && (
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={settings.twoColumnsOn80mm}
                      onChange={(e) =>
                        setSettings((s) => ({ ...s, twoColumnsOn80mm: e.target.checked }))
                      }
                      style={{ accentColor: 'var(--accent-primary)' }}
                    />
                    2 por fila en 80mm (Ahorra 50% de hoja)
                  </label>
                )}

                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={settings.showCutGuides}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, showCutGuides: e.target.checked }))
                    }
                    style={{ accentColor: 'var(--accent-primary)' }}
                  />
                  <Scissors size={14} /> Guías punteadas de recorte
                </label>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: MEDIDOR DE HOJA + VISTA PREVIA DEL TICKET TÉRMICO */}
          <div
            style={{
              padding: '20px 24px',
              background: 'var(--bg-app)',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {/* Medidor de gasto de papel */}
            <div
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-medium)',
              }}
            >
              <div className="flex-between" style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                  Largo de Hoja a Imprimir:
                </span>
                <span
                  style={{
                    fontSize: '0.9rem',
                    fontWeight: 800,
                    color: usagePercent >= 95 ? '#f59e0b' : 'var(--accent-success)',
                  }}
                >
                  ~{stripMetrics.estimatedHeightCm} cm / {(stripMetrics.maxAllowedHeightMm / 10).toFixed(1)} cm máx.
                </span>
              </div>

              <div
                style={{
                  width: '100%',
                  height: '8px',
                  borderRadius: '99px',
                  background: 'var(--border-light)',
                  overflow: 'hidden',
                  marginBottom: '8px',
                }}
              >
                <div
                  style={{
                    width: `${usagePercent}%`,
                    height: '100%',
                    borderRadius: '99px',
                    background: usagePercent >= 95 ? '#f59e0b' : 'var(--accent-success)',
                    transition: 'width 0.25s ease',
                  }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                }}
              >
                <span>
                  {stripMetrics.totalLabels} etiqueta{stripMetrics.totalLabels !== 1 ? 's' : ''} en{' '}
                  {stripMetrics.rowsUsed} fila{stripMetrics.rowsUsed !== 1 ? 's' : ''}
                </span>
                <span>Capacidad tope: {stripMetrics.maxLabelsAllowed} etiq.</span>
              </div>
            </div>

            {/* Lista de tira acumulada si agregó varios productos */}
            {stripQueue.length > 0 && (
              <div
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-medium)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div className="flex-between">
                  <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>
                    Productos en la tira ({stripQueue.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setStripQueue([])}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-danger)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Vaciar tira
                  </button>
                </div>

                <div style={{ maxHeight: '115px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {stripQueue.map((qItem) => (
                    <div
                      key={qItem.uid}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '6px 8px',
                        background: 'var(--bg-app)',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                      }}
                    >
                      <div style={{ overflow: 'hidden', marginRight: '8px' }}>
                        <div
                          style={{
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {qItem.name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                          {qItem.code}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => handleUpdateQueueCopies(qItem.uid, -1)}
                          style={{
                            border: '1px solid var(--border-medium)',
                            background: 'var(--bg-card)',
                            borderRadius: '4px',
                            padding: '2px 5px',
                            cursor: 'pointer',
                          }}
                        >
                          <Minus size={11} />
                        </button>
                        <span style={{ minWidth: '18px', textAlign: 'center', fontWeight: 700 }}>
                          {qItem.copies}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQueueCopies(qItem.uid, 1)}
                          disabled={stripMetrics.remainingLabelsCapacity <= 0}
                          style={{
                            border: '1px solid var(--border-medium)',
                            background: 'var(--bg-card)',
                            borderRadius: '4px',
                            padding: '2px 5px',
                            cursor: 'pointer',
                            opacity: stripMetrics.remainingLabelsCapacity <= 0 ? 0.4 : 1,
                          }}
                        >
                          <Plus size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveFromQueue(qItem.uid)}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--accent-danger)',
                            cursor: 'pointer',
                            padding: '2px 4px',
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Simulación fiel de Rollo de Papel Térmico Blanco */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span
                style={{
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Vista Previa Real ({settings.paperWidth}mm Rollo de Factura)
              </span>

              <div
                style={{
                  width: settings.paperWidth === 80 ? '300px' : '218px',
                  backgroundColor: '#FFFFFF',
                  color: '#000000',
                  borderRadius: '4px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.16)',
                  borderTop: '3px dashed #CBD5E1',
                  borderBottom: '3px dashed #CBD5E1',
                  padding: '8px 8px',
                  transition: 'width 0.2s ease',
                }}
              >
                {previewCells.length === 0 ? (
                  <div
                    style={{
                      padding: '24px 12px',
                      textAlign: 'center',
                      color: '#64748B',
                      fontSize: '0.8rem',
                    }}
                  >
                    Ingresa un código válido para previsualizar el ticket térmico.
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(${previewGridCols}, minmax(0, 1fr))`,
                    }}
                  >
                    {previewCells.map((cell, idx) => {
                      const rowIdx = Math.floor(idx / previewGridCols);
                      const totalRows = Math.ceil(previewCells.length / previewGridCols);
                      const isLastRow = rowIdx === totalRows - 1;
                      const isLeftColInPair = previewGridCols === 2 && idx % 2 === 0;

                      return (
                        <div
                          key={cell.key}
                          style={{
                            padding: '6px 4px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            borderBottom:
                              !isLastRow && settings.showCutGuides
                                ? '1px dashed #000000'
                                : 'none',
                            borderRight:
                              isLeftColInPair && settings.showCutGuides
                                ? '1px dashed #000000'
                                : 'none',
                            backgroundColor: '#FFFFFF',
                            color: '#000000',
                          }}
                        >
                          {settings.showProductName && (
                            <div
                              style={{
                                fontSize: previewGridCols === 2 ? '10px' : '11.5px',
                                fontWeight: 800,
                                color: '#000000',
                                lineHeight: 1.15,
                                marginBottom: '2px',
                                maxWidth: '100%',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                wordBreak: 'break-word',
                              }}
                            >
                              {cell.name || 'Nombre del Producto'}
                            </div>
                          )}

                          {settings.showPrice && typeof cell.price === 'number' && cell.price > 0 && (
                            <div
                              style={{
                                fontSize: '10px',
                                fontWeight: 800,
                                color: '#000000',
                                marginBottom: '2px',
                              }}
                            >
                              {currencySymbol}
                              {cell.price.toFixed(2)}
                            </div>
                          )}

                          {cell.svgMarkup ? (
                            <div
                              style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
                              dangerouslySetInnerHTML={{ __html: cell.svgMarkup }}
                            />
                          ) : (
                            <span style={{ fontSize: '11px', color: '#EF4444' }}>Código inválido</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <p
                style={{
                  marginTop: '10px',
                  fontSize: '0.74rem',
                  color: 'var(--text-muted)',
                  textAlign: 'center',
                  maxWidth: '300px',
                  lineHeight: 1.35,
                }}
              >
                Tip: Recorta por la línea punteada y pega con cinta transparente sobre el {productWord} o estante.
              </p>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--border-medium)',
            background: 'var(--bg-app)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <Check size={16} color="var(--accent-success)" />
            <span>
              Impresión aislada sin márgenes extra (~{stripMetrics.estimatedHeightCm} cm de papel)
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handlePrint}
              disabled={previewCells.length === 0}
              style={{
                padding: '10px 20px',
                fontWeight: 800,
                opacity: previewCells.length === 0 ? 0.5 : 1,
              }}
            >
              <Printer size={18} /> Imprimir en Térmica ({previewCells.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarcodeGenerator;
