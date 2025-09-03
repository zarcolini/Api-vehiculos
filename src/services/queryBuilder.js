import { filterEmptyParams } from '../utils/helpers.js';

/**
 * Construye consulta SQL dinámica
 * @param {string} baseQuery - Consulta base
 * @param {Object} searchParams - Parámetros de búsqueda
 * @param {Object} validFields - Campos válidos
 * @returns {Object} - {query, params}
 */
export const buildDynamicQuery = (baseQuery, searchParams, validFields) => {
  let query = baseQuery;
  const queryParams = [];

  for (const key in searchParams) {
    if (validFields[key]) {
      const fieldConfig = validFields[key];
      const value = searchParams[key];

      console.log(`Procesando campo: ${key} = ${value} (tipo: ${typeof value})`);

      if (key === "ids" && Array.isArray(value)) {
        // Manejo especial para array de IDs
        if (value.length === 0) {
          console.warn(`Array vacío para ${key}, ignorando campo`);
          continue;
        }
        const placeholders = value.map(() => "?").join(",");
        query += ` AND ${fieldConfig.column} IN (${placeholders})`;
        queryParams.push(...value);
      } else if ((key === "productos_ids") && Array.isArray(value)) {
        // Manejo especial para array de productos_ids
        if (value.length === 0) {
          console.warn(`Array vacío para ${key}, ignorando campo`);
          continue;
        }
        const placeholders = value.map(() => "?").join(",");
        query += ` AND ${fieldConfig.column} IN (${placeholders})`;
        queryParams.push(...value);
      } else if (fieldConfig.operator === "LIKE") {
        query += ` AND ${fieldConfig.column} ${fieldConfig.operator} ?`;
        queryParams.push(`%${value}%`);
      } else {
        query += ` AND ${fieldConfig.column} ${fieldConfig.operator} ?`;
        queryParams.push(value);
      }
    } else {
      console.warn(`ADVERTENCIA: Campo '${key}' no válido, ignorado.`);
    }
  }

  return { query, queryParams };
};
