export const PRODUCTO_AVAILABLE_FIELDS = [
  'id', 'codigo_alterno', 'nombre', 'codigo_grupo', 'habilitado', 
  'congelado', 'item_compra', 'item_venta', 'item_inventario', 
  'codigo_hertz', 'tipo', 'tipo_sap', 'marca', 'anio', 'modelo', 
  'color', 'cilindrada', 'serie', 'motor', 'placa', 'tipo_vehiculo', 
  'chasis', 'precio_costo', 'precio_venta', 'km', 'k5', 'k10', 
  'k20', 'k40', 'k100', 'sincronizado', 'horas', 'tipo_mant', 'clase'
];

// Mapeo de campos válidos para búsqueda de productos
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

// Mapeo de campos válidos para búsqueda de ventas
export const VENTAS_VALID_FIELDS = {
  id: { column: "id", operator: "=" },
  ids: { column: "id", operator: "IN" },
  precio: { column: "precio_venta", operator: "=" },
  precio_minimo: { column: "precio_venta", operator: ">=" },
  precio_maximo: { column: "precio_venta", operator: "<=" },
  trasmision: { column: "trasmision", operator: "=" },
  id_estado: { column: "id_estado", operator: "=" },
  km: { column: "kilometraje", operator: "=" },
  id_tienda: { column: "id_tienda", operator: "=" },
  producto_id: { column: "id_producto", operator: "=" },
  productos_ids: { column: "id_producto", operator: "IN" },
  fecha_venta: { column: "fecha_vendido", operator: "=" },
  fecha_desde: { column: "fecha_vendido", operator: ">=" },
  fecha_distinto: { column: "fecha_vendido", operator: "!=" },
  fecha_hasta: { column: "fecha_vendido", operator: "<=" },
};