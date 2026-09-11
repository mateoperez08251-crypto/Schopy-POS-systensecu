import { fetch as tauriFetch } from '@tauri-apps/plugin-http';

export interface RncResult {
  error: boolean;
  cedula_rnc: string;
  nombre_razon_social: string;
  nombre_comercial: string;
  estado: string;
  actividad_economica: string;
}

/**
 * Busca un contribuyente por RNC/Cédula usando la API de megaplus
 */
export const searchByRnc = async (rnc: string): Promise<RncResult | null> => {
  try {
    const clean = rnc.replace(/[^0-9]/g, '');
    const response = await tauriFetch(`https://rnc.megaplus.com.do/api/consulta?rnc=${clean}`, {
      method: 'GET',
    });
    if (response.ok) {
      const data = await response.json() as RncResult;
      if (!data.error && (data.nombre_razon_social || data.nombre_comercial)) {
        return data;
      }
    }
    return null;
  } catch (error) {
    console.error("Error consultando RNC:", error);
    return null;
  }
};

/**
 * Busca un contribuyente por nombre/razón social usando la API de megaplus
 */
export const searchByName = async (name: string): Promise<RncResult | null> => {
  try {
    const response = await tauriFetch(`https://rnc.megaplus.com.do/api/consulta/nombre?buscar=${encodeURIComponent(name)}`, {
      method: 'GET',
    });
    if (response.ok) {
      const data = await response.json() as RncResult;
      if (!data.error && data.cedula_rnc) {
        return data;
      }
    }
    return null;
  } catch (error) {
    console.error("Error consultando Nombre:", error);
    return null;
  }
};
