import { db } from "../db.js";
import { filterEmptyParams, processFieldSelection, processLimit } from '../utils/helpers.js';
import { PRODUCTO_AVAILABLE_FIELDS, PRODUCTO_VALID_FIELDS } from '../config/fieldMapping.js';
import { buildDynamicQuery } from '../services/queryBuilder.js';

/**
 * @description Busca productos dinámicamente según los criterios proporcionados
 * CON SOPORTE PARA FILTROS DE CAMPOS
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const searchProductos = async (req, res) => {
  let originalParams = req.body;
  console.log(`-> POST /api/productos/search:`, originalParams);

  // Filtrar parámetros vacíos
  originalParams = filterEmptyParams(originalParams);
  console.log(`-> Parámetros filtrados:`, originalParams);

  const searchParams = { ...originalParams };

  const maxResults = searchParams.max_results;
  const requestedFields = searchParams.fields;
  delete searchParams.max_results;
  delete searchParams.fields;

  
  const { selectedFields } = processFieldSelection(requestedFields, PRODUCTO_AVAILABLE_FIELDS);

  // Si no hay filtros de búsqueda
  if (!searchParams || Object.keys(searchParams).length === 0) {
    console.log("Sin filtros, devolviendo todos los productos...");
    try {
      let query = `SELECT ${selectedFields} FROM producto`;
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