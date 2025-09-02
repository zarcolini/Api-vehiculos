import { db } from "../db.js";
import { filterEmptyParams, processFieldSelection, processLimit } from '../utils/helpers.js';
import { PRODUCTO_AVAILABLE_FIELDS, PRODUCTO_VALID_FIELDS } from '../config/fieldMappings.js';
import { buildDynamicQuery } from '../services/queryBuilder.js';


export const searchProductos = async (req, res) => {
  let originalParams = req.body;
  console.log(`-> POST /api/productos/search:`, originalParams);

  // Filtrar parámetros vacíos
  originalParams = filterEmptyParams(originalParams);
  console.log(`-> Parámetros filtrados:`, originalParams);

  const searchParams = { ...originalParams };

  // Extraer parámetros especiales
  const maxResults = searchParams.max_results;
  const requestedFields = searchParams.fields;
  delete searchParams.max_results;
  delete searchParams.fields;

  // Procesar selección de campos
  const { selectedFields } = processFieldSelection(requestedFields, PRODUCTO_AVAILABLE_FIELDS);

  // Si no hay filtros de búsqueda
  if (!searchParams || Object.keys(searchParams).length === 0) {
    console.log("Sin filtros, devolviendo todos los productos...");
    try {
      let query = `SELECT ${selectedFields} FROM producto ORDER BY id DESC`;
      query += processLimit(maxResults);

      const [rows] = await db.execute(query);
      return res.status(200).json({
        status: "success",
        count: rows.length,
        data: rows,
        message: "Todos los productos",
        limited: maxResults ? true : false,
        max_results_applied: maxResults || null,
        fields_selected: selectedFields === '*' ? 'all' : requestedFields
      });
    } catch (error) {
      console.error("ERROR al obtener productos:", error.message);
      return res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
      });
    }
  }

  // Construir consulta dinámica
  let baseQuery = `SELECT ${selectedFields} FROM producto WHERE 1=1`;
  const { query, queryParams } = buildDynamicQuery(baseQuery, searchParams, PRODUCTO_VALID_FIELDS);
  
  const finalQuery = query + " ORDER BY id DESC" + processLimit(maxResults);

  console.log(`SQL: ${finalQuery}`);
  console.log(`Parámetros: [${queryParams.join(", ")}]`);

  try {
    const [rows] = await db.execute(finalQuery, queryParams);

    if (rows.length === 0) {
      return res.status(404).json({
        status: "fail",
        message: "No se encontraron productos con los criterios especificados.",
      });
    }

    res.status(200).json({
      status: "success",
      count: rows.length,
      data: rows,
      limited: maxResults ? true : false,
      max_results_applied: maxResults || null,
      fields_selected: selectedFields === '*' ? 'all' : requestedFields,
      available_fields: PRODUCTO_AVAILABLE_FIELDS
    });
  } catch (error) {
    console.error(`ERROR en searchProductos:`, error.message);
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor al buscar productos.",
    });
  }
};

/**
 * Obtiene productos disponibles para venta CON SOPORTE PARA FIELDS
 */
export const getProductosDisponibles = async (req, res) => {
  let filters = req.body || {};
  console.log("-> POST /api/productos/disponibles:", filters);

  filters = filterEmptyParams(filters);
  
  // Extraer parámetros especiales
  const maxResults = filters.max_results;
  const requestedFields = filters.fields;
  delete filters.max_results;
  delete filters.fields;

  // Procesar campos - para JOINs necesitamos manejar campos con prefijo
  let selectedFields = 'p.*';
  if (requestedFields && Array.isArray(requestedFields) && requestedFields.length > 0) {
    const validFields = requestedFields.filter(field => 
      PRODUCTO_AVAILABLE_FIELDS.includes(field)
    );
    
    if (validFields.length > 0) {
      selectedFields = validFields.map(field => `p.${field}`).join(', ');
    }
  }

  try {
    let baseQuery = `
      SELECT ${selectedFields}, 
             CASE 
                 WHEN v.producto_id IS NOT NULL THEN 'Vendido'
                 WHEN p.congelado = 1 THEN 'Congelado'
                 WHEN p.item_venta = 0 THEN 'No disponible para venta'
                 ELSE 'Disponible'
             END as estado_venta
      FROM producto p 
      LEFT JOIN ventas v ON p.id = v.producto_id 
      WHERE v.producto_id IS NULL 
        AND p.habilitado = 1 
        AND p.congelado = 0 
        AND p.item_venta = 1
    `;

    const queryParams = [];

    // Agregar filtros
    if (filters.marca) {
      baseQuery += ` AND p.marca LIKE ?`;
      queryParams.push(`%${filters.marca}%`);
    }
    if (filters.modelo) {
      baseQuery += ` AND p.modelo LIKE ?`;
      queryParams.push(`%${filters.modelo}%`);
    }
    if (filters.anio) {
      baseQuery += ` AND p.anio = ?`;
      queryParams.push(filters.anio);
    }
    if (filters.km_maximo) {
      baseQuery += ` AND p.km <= ?`;
      queryParams.push(filters.km_maximo);
    }
    if (filters.precio_venta_maximo) {
      baseQuery += ` AND p.precio_venta <= ?`;
      queryParams.push(filters.precio_venta_maximo);
    }

    baseQuery += ` ORDER BY p.id DESC` + processLimit(maxResults);

    const [rows] = await db.execute(baseQuery, queryParams);

    res.status(200).json({
      status: "success",
      count: rows.length,
      data: rows,
      message: "Productos disponibles para venta",
      limited: maxResults ? true : false,
      max_results_applied: maxResults || null,
      fields_selected: selectedFields === 'p.*' ? 'all' : requestedFields,
      available_fields: PRODUCTO_AVAILABLE_FIELDS
    });
  } catch (error) {
    console.error("ERROR en getProductosDisponibles:", error.message);
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor",
    });
  }
};

/**
 * Obtiene productos vendidos CON SOPORTE PARA FIELDS
 */
export const getProductosVendidos = async (req, res) => {
  let filters = req.body || {};
  console.log("-> POST /api/productos/vendidos:", filters);

  filters = filterEmptyParams(filters);
  
  // Extraer parámetros especiales
  const maxResults = filters.max_results;
  const requestedFields = filters.fields;
  delete filters.max_results;
  delete filters.fields;

  // Procesar campos
  let selectedFields = 'p.*';
  if (requestedFields && Array.isArray(requestedFields) && requestedFields.length > 0) {
    const validFields = requestedFields.filter(field => 
      PRODUCTO_AVAILABLE_FIELDS.includes(field)
    );
    
    if (validFields.length > 0) {
      selectedFields = validFields.map(field => `p.${field}`).join(', ');
    }
  }

  try {
    let baseQuery = `
      SELECT ${selectedFields}, 
             v.id as venta_id,
             v.precio_venta as precio_vendido,
             v.fecha_vendido as fecha_venta,
             'Vendido' as estado_venta
      FROM producto p 
      INNER JOIN ventas v ON p.id = v.id_producto 
      WHERE 1=1
    `;

    const queryParams = [];

    // Agregar filtros
    if (filters.marca) {
      baseQuery += ` AND p.marca LIKE ?`;
      queryParams.push(`%${filters.marca}%`);
    }
    if (filters.modelo) {
      baseQuery += ` AND p.modelo LIKE ?`;
      queryParams.push(`%${filters.modelo}%`);
    }
    if (filters.anio) {
      baseQuery += ` AND p.anio = ?`;
      queryParams.push(filters.anio);
    }
    if (filters.fecha_venta_desde) {
      baseQuery += ` AND v.fecha_vendido >= ?`;
      queryParams.push(filters.fecha_venta_desde);
    }
    if (filters.fecha_venta_hasta) {
      baseQuery += ` AND v.fecha_vendido <= ?`;
      queryParams.push(filters.fecha_venta_hasta);
    }

    baseQuery += ` ORDER BY v.fecha_vendido DESC` + processLimit(maxResults);

    const [rows] = await db.execute(baseQuery, queryParams);

    res.status(200).json({
      status: "success",
      count: rows.length,
      data: rows,
      message: "Productos vendidos",
      limited: maxResults ? true : false,
      max_results_applied: maxResults || null,
      fields_selected: selectedFields === 'p.*' ? 'all' : requestedFields,
      available_fields: PRODUCTO_AVAILABLE_FIELDS
    });
  } catch (error) {
    console.error("ERROR en getProductosVendidos:", error.message);
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor",
    });
  }
};

/**
 * Verifica el estado de venta de productos
 */
export const getEstadoVentaProducto = async (req, res) => {
  let searchParams = req.body;
  console.log(`-> POST /api/productos/estado-venta:`, searchParams);

  searchParams = filterEmptyParams(searchParams);

  if (!searchParams || Object.keys(searchParams).length === 0) {
    return res.status(400).json({
      status: "fail",
      message: "Se requiere al menos un parámetro de búsqueda.",
    });
  }

  // Extraer parámetros especiales
  const maxResults = searchParams.max_results;
  delete searchParams.max_results;

  // Mapeo de campos para estado de venta
  const validFields = {
    id: { column: "p.id", operator: "=" },
    ids: { column: "p.id", operator: "IN" },
    codigo_alterno: { column: "p.codigo_alterno", operator: "LIKE" },
    nombre: { column: "p.nombre", operator: "LIKE" },
    marca: { column: "p.marca", operator: "LIKE" },
    modelo: { column: "p.modelo", operator: "LIKE" },
    placa: { column: "p.placa", operator: "LIKE" },
    serie: { column: "p.serie", operator: "LIKE" },
  };

  let baseQuery = `
    SELECT p.*,
           v.id as venta_id,
           v.precio_venta as precio_vendido,
           v.fecha_vendido as fecha_venta,
           CASE 
               WHEN v.id_producto IS NOT NULL THEN 'Vendido'
               WHEN p.congelado = 1 THEN 'Congelado'
               WHEN p.item_venta = 0 THEN 'No disponible para venta'
               WHEN p.habilitado = 0 THEN 'Deshabilitado'
               ELSE 'Disponible'
           END as estado_venta,
           CASE 
               WHEN v.id_producto IS NOT NULL THEN false
               WHEN p.congelado = 1 OR p.item_venta = 0 OR p.habilitado = 0 THEN false
               ELSE true
           END as disponible_para_venta
    FROM producto p 
    LEFT JOIN ventas v ON p.id = v.id_producto 
    WHERE 1=1
  `;

  const queryParams = [];

  // Construir consulta dinámica
  for (const key in searchParams) {
    if (validFields[key]) {
      const fieldConfig = validFields[key];
      const value = searchParams[key];

      if (key === "ids" && Array.isArray(value)) {
        if (value.length === 0) continue;
        const placeholders = value.map(() => "?").join(",");
        baseQuery += ` AND ${fieldConfig.column} IN (${placeholders})`;
        queryParams.push(...value);
      } else if (fieldConfig.operator === "LIKE") {
        baseQuery += ` AND ${fieldConfig.column} ${fieldConfig.operator} ?`;
        queryParams.push(`%${value}%`);
      } else {
        baseQuery += ` AND ${fieldConfig.column} ${fieldConfig.operator} ?`;
        queryParams.push(value);
      }
    } else {
      console.warn(`Campo '${key}' no válido, ignorado.`);
    }
  }

  baseQuery += ` ORDER BY p.id DESC` + processLimit(maxResults);

  try {
    const [rows] = await db.execute(baseQuery, queryParams);

    if (rows.length === 0) {
      return res.status(404).json({
        status: "fail",
        message: "No se encontraron productos con los criterios especificados.",
      });
    }

    // Agregar resumen a cada producto
    const resultados = rows.map((producto) => ({
      ...producto,
      resumen: {
        producto_id: producto.id,
        nombre: producto.nombre,
        estado: producto.estado_venta,
        disponible: producto.disponible_para_venta,
        vendido: producto.venta_id ? true : false,
        fecha_venta: producto.fecha_venta || null,
      },
    }));

    res.status(200).json({
      status: "success",
      count: rows.length,
      data: resultados,
      message: "Estado de venta de productos",
      limited: maxResults ? true : false,
      max_results_applied: maxResults || null,
    });
  } catch (error) {
    console.error(`ERROR en getEstadoVentaProducto:`, error.message);
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor",
    });
  }
};

/**
 * Obtiene estadísticas de productos por estado
 */
export const getEstadisticasVentas = async (req, res) => {
  console.log("-> GET /api/productos/estadisticas-ventas");

  try {
    const query = `
      SELECT 
          COUNT(*) as total_productos,
          COUNT(v.id_producto) as productos_vendidos,
          COUNT(*) - COUNT(v.id_producto) as productos_disponibles,
          SUM(CASE WHEN p.congelado = 1 THEN 1 ELSE 0 END) as productos_congelados,
          SUM(CASE WHEN p.habilitado = 0 THEN 1 ELSE 0 END) as productos_deshabilitados,
          SUM(CASE WHEN p.item_venta = 0 THEN 1 ELSE 0 END) as productos_no_venta,
          ROUND(COUNT(v.id_producto) * 100.0 / COUNT(*), 2) as porcentaje_vendidos
      FROM producto p 
      LEFT JOIN ventas v ON p.id = v.id_producto
    `;

    const [rows] = await db.execute(query);
    const stats = rows[0];

    res.status(200).json({
      status: "success",
      data: {
        total_productos: stats.total_productos,
        productos_vendidos: stats.productos_vendidos,
        productos_disponibles: stats.productos_disponibles,
        productos_congelados: stats.productos_congelados,
        productos_deshabilitados: stats.productos_deshabilitados,
        productos_no_venta: stats.productos_no_venta,
        porcentaje_vendidos: `${stats.porcentaje_vendidos}%`,
      },
      message: "Estadísticas de productos",
    });
  } catch (error) {
    console.error("ERROR en getEstadisticasVentas:", error.message);
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor",
    });
  }
};