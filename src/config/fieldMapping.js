export const PRODUCTO_AVAILABLE_FIELDS = [
  "id",
  "codigo_alterno",
  "nombre",
  "codigo_grupo",
  "habilitado",
  "congelado",
  "item_compra",
  "item_venta",
  "item_inventario",
  "codigo_hertz",
  "tipo",
  "tipo_sap",
  "marca",
  "anio",
  "modelo",
  "color",
  "cilindrada",
  "serie",
  "motor",
  "placa",
  "tipo_vehiculo",
  "chasis",
  "precio_costo",
  "precio_venta",
  "km",
  "k5",
  "k10",
  "k20",
  "k40",
  "k100",
  "sincronizado",
  "horas",
  "tipo_mant",
  "clase",
];
export const PRODUCTO_VALID_FIELDS = {
  // Identificación
  id: { column: "id", operator: "=" },
  ids: { column: "id", operator: "IN" },
  codigo_alterno: { column: "codigo_alterno", operator: "LIKE" },
  nombre: { column: "nombre", operator: "LIKE" },

  // Especificaciones del vehículo
  marca: { column: "marca", operator: "LIKE" },
  anio: { column: "anio", operator: "=" },
  anio_desde: { column: "anio", operator: ">=" },
  anio_hasta: { column: "anio", operator: "<=" },
  modelo: { column: "modelo", operator: "LIKE" },
  color: { column: "color", operator: "LIKE" },
  cilindrada: { column: "cilindrada", operator: "LIKE" },
  tipo_vehiculo: { column: "tipo_vehiculo", operator: "LIKE" },

  // Identificadores del vehículo
  serie: { column: "serie", operator: "LIKE" },
  motor: { column: "motor", operator: "LIKE" },
  placa: { column: "placa", operator: "LIKE" },
  chasis: { column: "chasis", operator: "LIKE" },

  // Precios
  precio_costo: { column: "precio_costo", operator: "=" },
  precio_costo_minimo: { column: "precio_costo", operator: ">=" },
  precio_costo_maximo: { column: "precio_costo", operator: "<=" },
  precio_venta: { column: "precio_venta", operator: "=" },
  precio_venta_minimo: { column: "precio_venta", operator: ">=" },
  precio_venta_maximo: { column: "precio_venta", operator: "<=" },

  // Kilometraje y horas
  km: { column: "km", operator: "=" },
  km_minimo: { column: "km", operator: ">=" },
  km_maximo: { column: "km", operator: "<=" },
  horas: { column: "horas", operator: "=" },
  horas_minimo: { column: "horas", operator: ">=" },
  horas_maximo: { column: "horas", operator: "<=" },

  // Estados y tipos
  habilitado: { column: "habilitado", operator: "=" },
  congelado: { column: "congelado", operator: "=" },
  item_venta: { column: "item_venta", operator: "=" },
  item_compra: { column: "item_compra", operator: "=" },
  item_inventario: { column: "item_inventario", operator: "=" },
  tipo: { column: "tipo", operator: "=" },
  tipo_mant: { column: "tipo_mant", operator: "=" },

  // Otros
  codigo_grupo: { column: "codigo_grupo", operator: "LIKE" },
  clase: { column: "clase", operator: "LIKE" },
};

export const VENTAS_AVAILABLE_FIELDS = [
  // Campos básicos
  "id",
  "numero",
  "id_usuario",
  "id_tienda",
  "id_estado",
  "id_producto",

  // Información del vehículo
  "kilometraje",
  "cilindraje",
  "trasmision",

  // Precios
  "precio_minimo",
  "precio_maximo",
  "precio_venta",

  // Fechas y tiempos
  "fecha",
  "hora",
  "fecha_vendido",
  "fecha_negociacion",
  "fecha_asignacion",
  "fecha_reparacion_completada",
  "fecha_promesa",

  // Personal involucrado
  "id_vendedor",
  "id_televentas",

  // Documentación
  "id_impuesto",
  "id_factura",
  "foto",

  // Inspección y reparación
  "id_inspeccion",
  "id_estado_pintura",
  "id_estado_interior",
  "id_estado_mecanica",
  "tipo_ventas_reparacion",
  "reproceso",

  // Observaciones
  "observaciones",
  "observaciones_reparacion",

  // Auditoría (los que ya tenías)
  "fecha_creacion",
  "usuario_creacion",
  "fecha_modificacion",
  "usuario_modificacion",
];
export const VENTAS_VALID_FIELDS = {
  // Campos existentes (mantener)
  id: { column: "id", operator: "=" },
  ids: { column: "id", operator: "IN" },
  producto_id: { column: "id_producto", operator: "=" },
  productos_ids: { column: "id_producto", operator: "IN" },

  // Agregar nuevos campos de búsqueda
  numero: { column: "numero", operator: "=" },
  id_usuario: { column: "id_usuario", operator: "=" },
  id_tienda: { column: "id_tienda", operator: "=" },
  id_estado: { column: "id_estado", operator: "=" },
  id_vendedor: { column: "id_vendedor", operator: "=" },

  // Precios
  precio_venta: { column: "precio_venta", operator: "=" },
  precio_minimo: { column: "precio_minimo", operator: ">=" },
  precio_maximo: { column: "precio_maximo", operator: "<=" },

  // Fechas
  fecha: { column: "fecha", operator: "=" },
  fecha_desde: { column: "fecha", operator: ">=" },
  fecha_hasta: { column: "fecha", operator: "<=" },
  fecha_vendido: { column: "fecha_vendido", operator: "=" },

  // Otros
  trasmision: { column: "trasmision", operator: "=" },
  kilometraje: { column: "kilometraje", operator: "=" },
  tipo_ventas_reparacion: { column: "tipo_ventas_reparacion", operator: "=" },
};

export const ESTADOS_AVAILABLE_FIELDS = [
  "id",
  "nombre",
  "foto",
  "envio_correo",
  "ventas_reparacion",
];

export const ESTADOS_VALID_FIELDS = {
  id: { column: "id", operator: "=" },
  ids: { column: "id", operator: "IN" },
  nombre: { column: "nombre", operator: "LIKE" },
  envio_correo: { column: "envio_correo", operator: "=" },
  ventas_reparacion: { column: "ventas_reparacion", operator: "=" },
};
/**
 * Obtiene los campos disponibles para una tabla específica
 * @param {string} tableName - Nombre de la tabla
 * @returns {Array} - Array de campos disponibles
 */
export const getAvailableFields = (tableName) => {
  const fieldMappings = {
    producto: PRODUCTO_AVAILABLE_FIELDS,
    ventas: VENTAS_AVAILABLE_FIELDS,
    estados: ESTADOS_AVAILABLE_FIELDS,
  };

  return fieldMappings[tableName] || [];
};

/**
 * Obtiene los campos válidos para búsqueda de una tabla específica
 * @param {string} tableName - Nombre de la tabla
 * @returns {Object} - Objeto con mapeo de campos válidos
 */
export const getValidFields = (tableName) => {
  const validMappings = {
    producto: PRODUCTO_VALID_FIELDS,
    ventas: VENTAS_VALID_FIELDS,
    estados: ESTADOS_VALID_FIELDS,
  };

  return validMappings[tableName] || {};
};

/**
 * Valida si un campo existe en los campos disponibles de una tabla
 * @param {string} tableName - Nombre de la tabla
 * @param {string} fieldName - Nombre del campo
 * @returns {boolean} - Si el campo es válido
 */
export const isValidField = (tableName, fieldName) => {
  const availableFields = getAvailableFields(tableName);
  return availableFields.includes(fieldName);
};

/**
 * Obtiene todos los operadores únicos usados en los mapeos
 * @returns {Array} - Array de operadores únicos
 */
export const getAllOperators = () => {
  const allFields = {
    ...PRODUCTO_VALID_FIELDS,
    ...VENTAS_VALID_FIELDS,
    ...ESTADOS_VALID_FIELDS,
  };

  const operators = new Set();
  Object.values(allFields).forEach((field) => {
    if (field.operator) {
      operators.add(field.operator);
    }
  });

  return Array.from(operators);
};

/**
 * Obtiene estadísticas de los field mappings
 * @returns {Object} - Estadísticas de los mapeos
 */
export const getFieldMappingStats = () => {
  return {
    tablas: {
      producto: {
        campos_disponibles: PRODUCTO_AVAILABLE_FIELDS.length,
        campos_buscables: Object.keys(PRODUCTO_VALID_FIELDS).length,
      },
      ventas: {
        campos_disponibles: VENTAS_AVAILABLE_FIELDS.length,
        campos_buscables: Object.keys(VENTAS_VALID_FIELDS).length,
      },
      estados: {
        campos_disponibles: ESTADOS_AVAILABLE_FIELDS.length,
        campos_buscables: Object.keys(ESTADOS_VALID_FIELDS).length,
      },
    },
    operadores_disponibles: getAllOperators(),
    total_tablas: 3,
  };
};
