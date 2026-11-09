import JsBarcode from 'jsbarcode';

export type BarcodeFormat = 'CODE128' | 'EAN13' | 'CODE39';
export type ThermalPaperWidth = 80 | 58;
export type ThermalLabelDensity = 'ultra-compact' | 'compact' | 'standard';
export type PaperLimitPreset = 'single-cut' | 'short-strip' | 'half-sheet';

export interface BarcodeLabelItem {
  uid: string;
  productId?: string;
  name: string;
  code: string;
  format: BarcodeFormat;
  price?: number;
  copies: number;
}

export interface ThermalPrintSettings {
  paperWidth: ThermalPaperWidth;
  twoColumnsOn80mm: boolean;
  density: ThermalLabelDensity;
  paperLimit: PaperLimitPreset;
  showProductName: boolean;
  showPrice: boolean;
  showCutGuides: boolean;
  currencySymbol: string;
}

export const PAPER_LIMIT_PRESETS: Record<
  PaperLimitPreset,
  { label: string; description: string; maxHeightMm: number }
> = {
  'single-cut': {
    label: 'Corte Mínimo (Máx. 3.5 cm)',
    description: 'Limita la salida a 1 sola fila ultra corta para gastar el mínimo papel.',
    maxHeightMm: 35,
  },
  'short-strip': {
    label: 'Tira Corta Ahorro (Máx. 9 cm)',
    description: 'Ideal para impresora de facturas: tope estricto de 9 cm por impresión.',
    maxHeightMm: 90,
  },
  'half-sheet': {
    label: 'Media Tira (Máx. 15 cm)',
    description: 'Tope máximo de 15 cm para lotes pequeños sin desperdiciar rollo.',
    maxHeightMm: 150,
  },
};

export const DENSITY_CONFIG: Record<
  ThermalLabelDensity,
  {
    label: string;
    rowHeightMm: number;
    barHeightPx: number;
    fontSizeCodePx: number;
    fontSizeNamePt: number;
    paddingVerticalMm: number;
  }
> = {
  'ultra-compact': {
    label: 'Ultra Compacta (2.2 cm)',
    rowHeightMm: 22,
    barHeightPx: 26,
    fontSizeCodePx: 10,
    fontSizeNamePt: 7.5,
    paddingVerticalMm: 1.2,
  },
  compact: {
    label: 'Compacta Térmica (2.7 cm)',
    rowHeightMm: 27,
    barHeightPx: 34,
    fontSizeCodePx: 11,
    fontSizeNamePt: 8.5,
    paddingVerticalMm: 1.8,
  },
  standard: {
    label: 'Estándar Legible (3.3 cm)',
    rowHeightMm: 33,
    barHeightPx: 42,
    fontSizeCodePx: 12,
    fontSizeNamePt: 9.5,
    paddingVerticalMm: 2.2,
  },
};

/**
 * Calcula el dígito verificador estándar GS1 Módulo 10 para códigos EAN-13 (a partir de 12 dígitos).
 */
export function calculateEan13CheckDigit(twelveDigits: string): string {
  const clean = twelveDigits.replace(/\D/g, '').slice(0, 12);
  if (clean.length !== 12) return '0';
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(clean[i], 10);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const remainder = sum % 10;
  return String(remainder === 0 ? 0 : 10 - remainder);
}

/**
 * Genera un código de barras único que no colisiona con el inventario existente.
 * Por defecto en CODE128 genera 8 dígitos numéricos pares (Modo C de alta densidad):
 * barras más gruesas y nítidas en papel térmico de facturas y 100% compatible con lectores USB.
 */
export function generateUniqueBarcode(
  existingCodes: string[],
  format: BarcodeFormat = 'CODE128'
): string {
  const normalizedSet = new Set(
    existingCodes.map((c) => String(c || '').trim().toUpperCase()).filter(Boolean)
  );

  for (let attempt = 0; attempt < 200; attempt++) {
    let candidate = '';
    if (format === 'EAN13') {
      // Prefijo 200 (uso interno en tienda según estándar GS1) + 9 dígitos + check digit
      let body = '200';
      for (let i = 0; i < 9; i++) {
        body += Math.floor(Math.random() * 10).toString();
      }
      candidate = body + calculateEan13CheckDigit(body);
    } else if (format === 'CODE39') {
      let body = '74';
      for (let i = 0; i < 6; i++) {
        body += Math.floor(Math.random() * 10).toString();
      }
      candidate = body;
    } else {
      // CODE128: 8 dígitos numéricos (activa automáticamente CODE128 Subset C de doble densidad)
      let body = '74';
      for (let i = 0; i < 6; i++) {
        body += Math.floor(Math.random() * 10).toString();
      }
      candidate = body;
    }

    if (!normalizedSet.has(candidate.toUpperCase())) {
      return candidate;
    }
  }

  return String(Date.now()).slice(-8);
}

/**
 * Valida y normaliza el código según el formato seleccionado.
 */
export function validateAndNormalizeBarcode(
  rawCode: string,
  format: BarcodeFormat
): { isValid: boolean; normalized: string; error?: string; helperNote?: string } {
  const trimmed = (rawCode || '').trim();
  if (!trimmed) {
    return { isValid: false, normalized: '', error: 'Ingresa o genera un código de barras.' };
  }

  if (format === 'EAN13') {
    const digitsOnly = trimmed.replace(/\D/g, '');
    if (digitsOnly !== trimmed) {
      return {
        isValid: false,
        normalized: trimmed,
        error: 'EAN-13 solo permite números (12 o 13 dígitos). Usa CODE128 para letras.',
      };
    }
    if (digitsOnly.length === 12) {
      const check = calculateEan13CheckDigit(digitsOnly);
      return {
        isValid: true,
        normalized: digitsOnly + check,
        helperNote: `Dígito verificador calculado automáticamente: ${digitsOnly}${check}`,
      };
    }
    if (digitsOnly.length === 13) {
      const expected = calculateEan13CheckDigit(digitsOnly.slice(0, 12));
      if (digitsOnly[12] !== expected) {
        return {
          isValid: false,
          normalized: digitsOnly,
          error: `Dígito verificador EAN-13 inválido (termina en ${digitsOnly[12]}, debería ser ${expected}).`,
        };
      }
      return { isValid: true, normalized: digitsOnly };
    }
    return {
      isValid: false,
      normalized: digitsOnly,
      error: 'EAN-13 requiere exactamente 12 o 13 dígitos numéricos.',
    };
  }

  if (format === 'CODE39') {
    const upper = trimmed.toUpperCase();
    if (!/^[0-9A-Z\-. $/+%]+$/.test(upper)) {
      return {
        isValid: false,
        normalized: upper,
        error: 'CODE39 solo admite letras A-Z, números 0-9 y símbolos (- . $ / + %).',
      };
    }
    return { isValid: true, normalized: upper };
  }

  // CODE128: caracteres ASCII imprimibles (32-126)
  if (!/^[\x20-\x7E]+$/.test(trimmed)) {
    return {
      isValid: false,
      normalized: trimmed,
      error: 'CODE128 no admite acentos ni caracteres especiales fuera de ASCII.',
    };
  }

  return { isValid: true, normalized: trimmed };
}

/**
 * Genera el SVG vectorial nítido (shape-rendering="crispEdges") optimizado para cabezales térmicos de 203 DPI.
 */
export function renderBarcodeSvgMarkup(
  code: string,
  format: BarcodeFormat,
  options: {
    barWidth?: number;
    barHeight: number;
    fontSize: number;
    displayValue?: boolean;
  }
): string | null {
  const check = validateAndNormalizeBarcode(code, format);
  if (!check.isValid || !check.normalized) return null;

  try {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    let validRender = true;

    JsBarcode(svg, check.normalized, {
      format,
      width: options.barWidth ?? 1.8,
      height: options.barHeight,
      displayValue: options.displayValue ?? true,
      fontSize: options.fontSize,
      font: 'monospace',
      fontOptions: 'bold',
      textMargin: 2,
      margin: 0,
      marginTop: 1,
      marginBottom: 1,
      marginLeft: 2,
      marginRight: 2,
      background: '#ffffff',
      lineColor: '#000000',
      valid: (v: boolean) => {
        validRender = v;
      },
    });

    if (!validRender) return null;

    // Garantizar viewBox para escalado limpio sin recortes en etiquetas estrechas
    const rawW = parseFloat(svg.getAttribute('width') || '0');
    const rawH = parseFloat(svg.getAttribute('height') || '0');
    if (rawW > 0 && rawH > 0 && !svg.getAttribute('viewBox')) {
      svg.setAttribute('viewBox', `0 0 ${rawW} ${rawH}`);
    }

    svg.setAttribute('shape-rendering', 'crispEdges');
    svg.style.maxWidth = '100%';
    svg.style.height = 'auto';
    svg.style.display = 'block';
    svg.style.margin = '0 auto';

    const rects = svg.querySelectorAll('rect');
    rects.forEach((r) => r.setAttribute('shape-rendering', 'crispEdges'));

    return svg.outerHTML;
  } catch {
    return null;
  }
}

export interface ThermalStripMetrics {
  totalLabels: number;
  effectiveColumns: 1 | 2;
  rowHeightMm: number;
  maxAllowedHeightMm: number;
  maxRowsAllowed: number;
  maxLabelsAllowed: number;
  rowsUsed: number;
  estimatedHeightMm: number;
  estimatedHeightCm: number;
  isAtOrOverLimit: boolean;
  remainingLabelsCapacity: number;
}

/**
 * Calcula las métricas físicas exactas de papel térmico y aplica el tope de hoja exclusivo del modal.
 */
export function calculateThermalStripMetrics(
  totalLabels: number,
  settings: ThermalPrintSettings
): ThermalStripMetrics {
  const densityCfg = DENSITY_CONFIG[settings.density];
  const limitCfg = PAPER_LIMIT_PRESETS[settings.paperLimit];

  const effectiveColumns: 1 | 2 =
    settings.paperWidth === 80 && settings.twoColumnsOn80mm ? 2 : 1;

  const rowHeightMm = densityCfg.rowHeightMm;
  const maxAllowedHeightMm = limitCfg.maxHeightMm;

  const maxRowsAllowed = Math.max(1, Math.floor((maxAllowedHeightMm - 2) / rowHeightMm));
  const maxLabelsAllowed = maxRowsAllowed * effectiveColumns;

  const clampedLabels = Math.min(Math.max(0, totalLabels), maxLabelsAllowed);
  const rowsUsed = clampedLabels > 0 ? Math.ceil(clampedLabels / effectiveColumns) : 0;
  const estimatedHeightMm = rowsUsed > 0 ? rowsUsed * rowHeightMm + 2 : 0;
  const estimatedHeightCm = Math.round((estimatedHeightMm / 10) * 10) / 10;

  return {
    totalLabels: clampedLabels,
    effectiveColumns,
    rowHeightMm,
    maxAllowedHeightMm,
    maxRowsAllowed,
    maxLabelsAllowed,
    rowsUsed,
    estimatedHeightMm,
    estimatedHeightCm,
    isAtOrOverLimit: totalLabels >= maxLabelsAllowed,
    remainingLabelsCapacity: Math.max(0, maxLabelsAllowed - clampedLabels),
  };
}

function escapeHtml(text: string): string {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Imprime los códigos de barra en un iframe 100% aislado para que la limitación de papel
 * aplique ÚNICAMENTE a este modal sin alterar las facturas ni tickets de venta del POS.
 */
export function printThermalBarcodesIsolated(
  items: BarcodeLabelItem[],
  settings: ThermalPrintSettings
): { success: boolean; printedCount: number; error?: string } {
  // Expandir items en etiquetas individuales respetando el límite estricto del modal
  const expanded: Array<{
    name: string;
    code: string;
    format: BarcodeFormat;
    price?: number;
    svgMarkup: string;
  }> = [];

  const densityCfg = DENSITY_CONFIG[settings.density];
  const effectiveColumns: 1 | 2 =
    settings.paperWidth === 80 && settings.twoColumnsOn80mm ? 2 : 1;

  const metricsCap = calculateThermalStripMetrics(9999, settings);
  const hardLabelCap = metricsCap.maxLabelsAllowed;

  for (const item of items) {
    if (expanded.length >= hardLabelCap) break;
    const svgMarkup = renderBarcodeSvgMarkup(item.code, item.format, {
      barWidth: effectiveColumns === 2 ? 1.35 : settings.paperWidth === 58 ? 1.5 : 1.9,
      barHeight: densityCfg.barHeightPx,
      fontSize: densityCfg.fontSizeCodePx,
      displayValue: true,
    });
    if (!svgMarkup) continue;

    const copies = Math.max(1, Math.floor(item.copies || 1));
    for (let c = 0; c < copies && expanded.length < hardLabelCap; c++) {
      expanded.push({
        name: item.name,
        code: item.code,
        format: item.format,
        price: item.price,
        svgMarkup,
      });
    }
  }

  if (expanded.length === 0) {
    return {
      success: false,
      printedCount: 0,
      error: 'No hay códigos de barra válidos para imprimir.',
    };
  }

  const finalMetrics = calculateThermalStripMetrics(expanded.length, settings);
  // Margen seguro interno para cabezales de 80mm (72mm imprimibles) y 58mm (48mm imprimibles)
  const printableWidthMm = settings.paperWidth === 80 ? 72 : 48;
  const strictMaxHeightMm = Math.min(
    finalMetrics.maxAllowedHeightMm,
    finalMetrics.estimatedHeightMm + 3
  );

  // Agrupar en filas según número de columnas
  let rowsHtml = '';
  for (let i = 0; i < expanded.length; i += effectiveColumns) {
    const rowItems = expanded.slice(i, i + effectiveColumns);
    const isLastRow = i + effectiveColumns >= expanded.length;

    const cellsHtml = rowItems
      .map((cell, idx) => {
        const showRightCut =
          effectiveColumns === 2 && idx === 0 && settings.showCutGuides;
        const nameHtml =
          settings.showProductName && cell.name.trim()
            ? `<div class="prod-name">${escapeHtml(cell.name.trim())}</div>`
            : '';
        const priceHtml =
          settings.showPrice && typeof cell.price === 'number' && cell.price > 0
            ? `<div class="prod-price">${escapeHtml(settings.currencySymbol)}${cell.price.toFixed(2)}</div>`
            : '';

        return `
          <div class="label-cell ${showRightCut ? 'cut-right' : ''}">
            ${nameHtml}
            ${priceHtml}
            <div class="barcode-wrap">${cell.svgMarkup}</div>
          </div>
        `;
      })
      .join('');

    // Si es 2 columnas y la última fila tiene 1 sola etiqueta, añadir celda vacía para mantener ancho mitad
    const fillerCell =
      effectiveColumns === 2 && rowItems.length === 1
        ? '<div class="label-cell empty-cell"></div>'
        : '';

    rowsHtml += `
      <div class="label-row ${!isLastRow && settings.showCutGuides ? 'cut-bottom' : ''}">
        ${cellsHtml}
        ${fillerCell}
      </div>
    `;
  }

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  document.body.appendChild(iframe);

  const printDoc = iframe.contentWindow?.document;
  if (!printDoc) {
    document.body.removeChild(iframe);
    return {
      success: false,
      printedCount: 0,
      error: 'No se pudo inicializar el motor de impresión aislada.',
    };
  }

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Etiquetas Código de Barra (${expanded.length})</title>
  <style>
    /* Estricto margin 0 suprime encabezados/pies del navegador que hacen avanzar toda la hoja */
    @page {
      margin: 0mm !important;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      width: ${printableWidthMm}mm !important;
      max-width: ${printableWidthMm}mm !important;
      height: auto !important;
      min-height: 0 !important;
      max-height: ${strictMaxHeightMm}mm !important;
      margin: 0 auto !important;
      padding: 0 !important;
      overflow: hidden !important;
      background: #ffffff !important;
      color: #000000 !important;
      font-family: Arial, Helvetica, sans-serif;
      page-break-after: avoid !important;
      break-after: avoid !important;
    }
    .strip-container {
      width: 100%;
      padding: 0.5mm 1mm;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    .label-row {
      display: grid;
      grid-template-columns: repeat(${effectiveColumns}, minmax(0, 1fr));
      width: 100%;
      align-items: center;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    .label-row.cut-bottom {
      border-bottom: 1px dashed #000000;
    }
    .label-cell {
      padding: ${densityCfg.paddingVerticalMm}mm 1.2mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      overflow: hidden;
    }
    .label-cell.cut-right {
      border-right: 1px dashed #000000;
    }
    .prod-name {
      font-size: ${densityCfg.fontSizeNamePt}pt;
      font-weight: 800;
      line-height: 1.12;
      color: #000000;
      max-width: 100%;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      word-break: break-word;
      margin-bottom: 0.8mm;
    }
    .prod-price {
      font-size: ${Math.max(7, densityCfg.fontSizeNamePt - 0.5)}pt;
      font-weight: 800;
      line-height: 1.05;
      color: #000000;
      margin-bottom: 0.6mm;
    }
    .barcode-wrap {
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .barcode-wrap svg {
      max-width: 100% !important;
      height: auto !important;
      display: block;
      shape-rendering: crispEdges;
    }
  </style>
</head>
<body>
  <div class="strip-container">
    ${rowsHtml}
  </div>
</body>
</html>`;

  printDoc.open();
  printDoc.write(html);
  printDoc.close();

  const win = iframe.contentWindow;
  if (win) {
    // Pequeño ciclo de renderizado para asegurar que el SVG esté pintado antes del spooler
    setTimeout(() => {
      try {
        win.focus();
        win.print();
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 4000);
      }
    }, 80);
  }

  return { success: true, printedCount: expanded.length };
}
