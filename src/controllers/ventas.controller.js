import { db } from "../db.js";
import { filterEmptyParams, processLimit, processFieldSelection } from '../utils/helpers.js';
import { VENTAS_VALID_FIELDS } from '../config/fieldMapping.js';
import { buildDynamicQuery } from '../services/queryBuilder.js';

// Campos disponibles en la tabla ventas - AGREGAR ESTO
const VENTAS_AVAILABLE_FIELDS = [
  'id', 'id_producto', 'precio_venta', 'kilometraje', 'trasmision', 
  'id_estado', 'id_tienda', 'fecha_vendido', 'fecha_creacion', 
  'usuario_creacion', 'fecha_modificacion', 'usuario_modificacion'
];

/**
 * Busca ventas dinámicamente CON SOPORTE PARA FILTROS DE CAMPOS
 */
export const searchVentas = async (req, res) => {
  let originalParams = req.body;
  console.log(`-> POST /api/ventas/search:`, originalParams);

  // FILTRAR PARÁMETROS VACÍOS
  originalParams = filterEmptyParams(originalParams);
  console.log(`-> Parámetros filtrados:`, originalParams);

  // Crear copia del objeto
  const searchParams = { ...originalParams };

  // Extraer parámetros especiales
  const maxResults = searchParams.max_results;
  const requestedFields = searchParams.fields;
  delete searchParams.max_results;
  delete searchParams.fields;

  // PROCESAR SELECCIÓN DE CAMPOS
  const { selectedFields } = processFieldSelection(requestedFields, VENTAS_AVAILABLE_FIELDS);

  // Si no hay parámetros de búsqueda
  if (!searchParams || Object.keys(searchParams).length === 0) {
    console.log("Sin filtros, devolviendo todas las ventas...");
    try {
      let query = `SELECT ${selectedFields} FROM ventas ORDER BY id DESC`;
      query += processLimit(maxResults);

      const [rows] = await db.execute(query);
      return res.status(200).json({
        status: "success",
        count: rows.length,
        data: rows,
        message: "Todas las ventas",
        limited: maxResults ? true : false,
        max_results_applied: maxResults || null,
        fields_selected: selectedFields === '*' ? 'all' : requestedFields
      });
    } catch (error) {
      console.error("ERROR al obtener ventas:", error.message);
      return res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
      });
    }
  }

  // Construir consulta dinámica
  const baseQuery = `SELECT ${selectedFields} FROM ventas WHERE 1=1`;
  const { query, queryParams } = buildDynamicQuery(baseQuery, searchParams, VENTAS_VALID_FIELDS);
  
  const finalQuery = query + " ORDER BY id DESC" + processLimit(maxResults);

  console.log(`SQL: ${finalQuery}`);
  console.log(`Parámetros: [${queryParams.map(p => `${p} (${typeof p})`).join(", ")}]`);

  try {
    const [rows] = await db.execute(finalQuery, queryParams);

    if (rows.length === 0) {
      return res.status(404).json({
        status: "fail",
        message: "No se encontraron ventas con los criterios especificados.",
      });
    }

    res.status(200).json({
      status: "success",
      count: rows.length,
      data: rows,
      limited: maxResults ? true : false,
      max_results_applied: maxResults || null,
      fields_selected: selectedFields === '*' ? 'all' : requestedFields,
      available_fields: VENTAS_AVAILABLE_FIELDS
    });
  } catch (error) {
    console.error(`ERROR en searchVentas:`, error.message);
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor al buscar ventas.",
    });
  }
};