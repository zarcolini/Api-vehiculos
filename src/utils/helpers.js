/**
 * Filtra parámetros vacíos de un objeto
 * @param {Object} params - Objeto con parámetros
 * @returns {Object} - Objeto filtrado
 */
export const filterEmptyParams = (params) => {
  const filtered = {};
  
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && 
        value !== undefined && 
        value !== '' && 
        !(Array.isArray(value) && value.length === 0) &&
        value !== 'null' &&
        value !== 'undefined') {
      filtered[key] = value;
    } else {
      console.log(`Parámetro vacío ignorado: ${key} = ${value}`);
    }
  }
  
  return filtered;
};

/**
 * Valida y procesa campos para consultas SELECT
 * @param {Array} requestedFields - Campos solicitados
 * @param {Array} availableFields - Campos disponibles
 * @returns {Object} - {selectedFields, validFields, invalidFields}
 */
export const processFieldSelection = (requestedFields, availableFields) => {
  let selectedFields = '*';
  let validFields = [];
  let invalidFields = [];
  
  if (requestedFields && Array.isArray(requestedFields) && requestedFields.length > 0) {
    validFields = requestedFields.filter(field => availableFields.includes(field));
    invalidFields = requestedFields.filter(field => !availableFields.includes(field));
    
    if (invalidFields.length > 0) {
      console.warn(`Campos inválidos ignorados: ${invalidFields.join(', ')}`);
    }
    
    if (validFields.length > 0) {
      selectedFields = validFields.join(', ');
      console.log(`Campos seleccionados: ${selectedFields}`);
    } else {
      console.warn('Ningún campo válido especificado, usando todos los campos');
    }
  }
  
  return { selectedFields, validFields, invalidFields };
};

/**
 * Procesa límites de resultados
 * @param {number} maxResults - Límite máximo
 * @returns {string} - Cadena LIMIT para SQL
 */
export const processLimit = (maxResults) => {
  if (maxResults) {
    const limitValue = Number(maxResults);
    if (limitValue > 0 && Number.isInteger(limitValue)) {
      console.log(`Aplicando límite de ${limitValue} resultados`);
      return ` LIMIT ${limitValue}`;
    }
  }
  return '';
};