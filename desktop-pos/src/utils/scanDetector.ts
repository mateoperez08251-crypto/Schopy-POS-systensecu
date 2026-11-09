const MAX_KEY_GAP_MS = 60;
const MIN_CODE_LENGTH = 5;

export interface ScanResult {
  isFirstKey: boolean;
  code: string | null;
}

/**
 * Distingue un lector de códigos de una persona: el lector teclea cada carácter
 * en pocos milisegundos y termina con Enter o Tab.
 */
export const createScanDetector = () => {
  let buffer = '';
  let lastKeyAt = 0;

  return {
    push(key: string, now: number): ScanResult {
      const isFast = now - lastKeyAt <= MAX_KEY_GAP_MS;

      if (key === 'Enter' || key === 'Tab') {
        const code = isFast && buffer.length >= MIN_CODE_LENGTH ? buffer : null;
        buffer = '';
        return { isFirstKey: false, code };
      }

      // Shift y similares no son caracteres, pero el lector los usa para las mayúsculas.
      if (key.length !== 1) return { isFirstKey: false, code: null };

      if (!isFast) buffer = '';
      buffer += key;
      lastKeyAt = now;
      return { isFirstKey: buffer.length === 1, code: null };
    }
  };
};
