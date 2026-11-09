import Fuse from 'fuse.js';

/**
 * Normaliza un texto eliminando acentos, caracteres especiales y convirtiendo a minúsculas
 */
export function normalizeString(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quita tildes (á->a, é->e, etc.)
    .replace(/[^a-z0-9\s]/g, ' ')   // Convierte símbolos a espacios
    .replace(/\s+/g, ' ')           // Colapsa múltiples espacios
    .trim();
}

/**
 * Calcula la distancia de Levenshtein entre dos cadenas para tolerancia a fallos ortográficos
 */
export function levenshtein(a: string, b: string): number {
  const an = a.length;
  const bn = b.length;
  if (an === 0) return bn;
  if (bn === 0) return an;

  const matrix = Array.from({ length: bn + 1 }, () => new Array(an + 1).fill(0));

  for (let i = 0; i <= an; i++) matrix[0][i] = i;
  for (let j = 0; j <= bn; j++) matrix[j][0] = j;

  for (let j = 1; j <= bn; j++) {
    for (let i = 1; i <= an; i++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[j][i] = matrix[j - 1][i - 1];
      } else {
        matrix[j][i] = Math.min(
          matrix[j - 1][i - 1] + 1, // sustitución
          matrix[j][i - 1] + 1,     // inserción
          matrix[j - 1][i] + 1      // eliminación
        );
      }
    }
  }

  return matrix[bn][an];
}

/**
 * Determina el máximo de errores (typos) permitidos según la longitud de la palabra
 */
function maxAllowedTypos(length: number): number {
  if (length <= 2) return 0;
  if (length <= 4) return 1;
  if (length <= 7) return 2;
  return 3;
}

export interface SearchOptions<T> {
  keys: (keyof T | string)[];
  threshold?: number;
}

/**
 * Motor de búsqueda inteligente de última generación para POS e Inventario.
 * Características:
 * 1. Búsqueda instantánea en tiempo real sin requerir terminar la palabra.
 * 2. Tolerancia a errores de escritura (typos / mala ortografía).
 * 3. Insensible a tildes y mayúsculas/minúsculas ("jabon" encuentra "Jabón").
 * 4. Búsqueda por múltiples palabras en cualquier orden ("cola 2l" encuentra "Coca Cola 2L").
 * 5. Coincidencias prioritarias por código de barras / SKU.
 */
export function smartSearch<T extends Record<string, any>>(
  items: T[],
  query: string,
  keys: (keyof T | string)[] = ['name', 'code', 'category', 'referenceCode']
): T[] {
  if (!items || items.length === 0) return [];
  if (!query || query.trim() === '') return items;

  const rawQuery = query.trim();
  const normQuery = normalizeString(rawQuery);
  if (!normQuery) return items;

  const queryTokens = normQuery.split(' ').filter(Boolean);

  // Mapa para puntajes calculados
  const scoredItems: { item: T; score: number }[] = [];
  const matchedItemSet = new Set<T>();

  for (const item of items) {
    let bestScore = 0;

    // Obtener valores de texto del ítem normalizados
    const fieldValues: string[] = [];
    let exactCodeMatch = false;
    let codeStartsWith = false;

    for (const key of keys) {
      const val = item[key as string];
      if (val !== undefined && val !== null) {
        const strVal = String(val);
        // Comprobar código de barras directo
        if (key === 'code' || key === 'sku' || key === 'referenceCode' || key === 'id') {
          if (strVal.toLowerCase() === rawQuery.toLowerCase()) {
            exactCodeMatch = true;
          } else if (strVal.toLowerCase().startsWith(rawQuery.toLowerCase())) {
            codeStartsWith = true;
          }
        }
        fieldValues.push(normalizeString(strVal));
      }
    }

    const combinedText = fieldValues.join(' ');
    const itemWords = combinedText.split(' ').filter(Boolean);

    // 1. Coincidencia exacta de código (Máxima prioridad en POS para lectores)
    if (exactCodeMatch) {
      bestScore = 2000;
    } else if (codeStartsWith) {
      bestScore = 1500;
    } else if (combinedText.startsWith(normQuery)) {
      // 2. Comienza con la frase exacta
      bestScore = 1200;
    } else if (combinedText.includes(normQuery)) {
      // 3. Contiene la subcadena completa exacta
      bestScore = 1000 - (combinedText.indexOf(normQuery) * 2);
    } else {
      // 4. Búsqueda por tokens (palabras individuales):
      // Permite buscar palabras en desorden y con palabras incompletas o errores
      let allTokensMatched = true;
      let tokenScoreSum = 0;

      for (const token of queryTokens) {
        let tokenMatched = false;
        let tokenScore = 0;

        for (const word of itemWords) {
          // Token exacto
          if (word === token) {
            tokenMatched = true;
            tokenScore = Math.max(tokenScore, 100);
            break;
          }
          // Palabra empieza con el token (búsqueda de prefijo instantánea)
          if (word.startsWith(token)) {
            tokenMatched = true;
            tokenScore = Math.max(tokenScore, 80 + (token.length / word.length) * 10);
            continue;
          }
          // Palabra contiene el token
          if (word.includes(token)) {
            tokenMatched = true;
            tokenScore = Math.max(tokenScore, 60);
            continue;
          }
          // Tolerancia a typos (Levenshtein) si el token tiene al menos 3 caracteres
          if (token.length >= 3) {
            const allowedDist = maxAllowedTypos(token.length);
            // Compara contra la palabra completa
            const dist = levenshtein(token, word);
            if (dist <= allowedDist) {
              tokenMatched = true;
              tokenScore = Math.max(tokenScore, 50 - (dist * 10));
              continue;
            }
            // Compara también con el prefijo de la palabra
            if (word.length >= token.length) {
              const wordPrefix = word.slice(0, token.length);
              const prefixDist = levenshtein(token, wordPrefix);
              if (prefixDist <= allowedDist) {
                tokenMatched = true;
                tokenScore = Math.max(tokenScore, 45 - (prefixDist * 10));
                continue;
              }
            }
          }
        }

        if (!tokenMatched) {
          allTokensMatched = false;
          break;
        }

        tokenScoreSum += tokenScore;
      }

      if (allTokensMatched) {
        bestScore = 500 + tokenScoreSum;
      }
    }

    if (bestScore > 0) {
      scoredItems.push({ item, score: bestScore });
      matchedItemSet.add(item);
    }
  }

  // 5. Capa de respaldo con Fuse.js (con ignoreLocation: true) para capturar cualquier otro caso complejo
  try {
    const fuseKeys = keys.map(k => {
      const strK = String(k);
      if (strK === 'name') return { name: strK, weight: 0.6 };
      if (strK === 'code' || strK === 'sku' || strK === 'referenceCode') return { name: strK, weight: 0.3 };
      return { name: strK, weight: 0.1 };
    });

    const fuse = new Fuse(items, {
      keys: fuseKeys,
      threshold: 0.55,          // Permisivo para tolerar typos fuertes
      ignoreLocation: true,     // CRUCIAL: busca en cualquier parte de la cadena sin penalización
      distance: 100,
      findAllMatches: true,
      minMatchCharLength: 1,
      includeScore: true
    });

    const fuseResults = fuse.search(normQuery);
    for (const res of fuseResults) {
      if (!matchedItemSet.has(res.item)) {
        // Puntuación de Fuse escalada (0 a 1 -> invertido)
        const fuseScore = Math.max(10, Math.round((1 - (res.score || 0)) * 400));
        scoredItems.push({ item: res.item, score: fuseScore });
        matchedItemSet.add(res.item);
      }
    }
  } catch (e) {
    // Fuse fallback silencioso
  }

  // Ordenar por puntuación descendente
  scoredItems.sort((a, b) => b.score - a.score);

  return scoredItems.map(s => s.item);
}
