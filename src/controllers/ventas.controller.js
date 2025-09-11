import { db } from "../db.js";
import { filterEmptyParams, processFieldSelection, processLimit } from '../utils/helpers.js';
import { VENTAS_VALID_FIELDS, VENTAS_AVAILABLE_FIELDS } from '../config/fieldMapping.js';
import { buildDynamicQuery } from '../services/queryBuilder.js';

/**
 * @description Busca ventas dinámicamente según los criterios proporcionados.
 * Si se busca por un ID único, también adjunta las fotos asociadas.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const searchVentas = async (req, res) => {
  let originalParams = req.body;
  console.log(
    `-> Solicitud POST en /api/ventas/search con parámetros:`,
    originalParams
  );

  // FILTRAR PARÁMETROS VACÍOS
  originalParams = filterEmptyParams(originalParams);
  console.log(`-> Parámetros después de filtrar vacíos:`, originalParams);

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
    console.log("Sin parámetros de búsqueda, devolviendo todas las ventas...");
    try {
      let query = `SELECT ${selectedFields} FROM ventas ORDER BY id DESC`;
      query += processLimit(maxResults);

      const [rows] = await db.execute(query);
      return res.status(200).json({
        status: "success",
        count: rows.length,
        data: rows,
        message: "Todas las ventas (sin filtros aplicados)",
        limited: !!maxResults,
        max_results_applied: maxResults || null,
        fields_selected: selectedFields === '*' ? 'all' : requestedFields
      });
    } catch (error) {
      console.error("!!! ERROR AL OBTENER TODAS LAS VENTAS:", error.message);
      return res.status(500).json({
        status: "error",
        message: "Error interno del servidor al obtener las ventas.",
      });
    }
  }

  // Construir consulta dinámica usando el query builder
  const baseQuery = `SELECT ${selectedFields} FROM ventas WHERE 1=1`;
  const { query, queryParams } = buildDynamicQuery(baseQuery, searchParams, VENTAS_VALID_FIELDS);
  
  const finalQuery = query + " ORDER BY id DESC" + processLimit(maxResults);

  console.log(`Consulta SQL a ejecutar: ${finalQuery}`);
  console.log(
    `Parámetros finales: [${queryParams
      .map((p) => `${p} (${typeof p})`)
      .join(", ")}]`
  );

  try {
    // 1. Ejecutar la consulta principal para obtener las ventas
    const [rows] = await db.execute(finalQuery, queryParams);

    if (rows.length === 0) {
      return res.status(404).json({
        status: "fail",
        message:
          "No se encontraron ventas con los criterios de búsqueda proporcionados.",
      });
    }

    // 2. Si se encontró un único resultado y la búsqueda fue por 'id', buscar sus fotos
    if (rows.length === 1 && searchParams.id) {
        console.log(`-> Venta única encontrada por ID. Buscando fotos...`);
        const ventaId = rows[0].id;
        
        // Consulta a la tabla 'ventas_fotos'
        const fotosQuery = 'SELECT id, nombre_archivo, principal FROM ventas_fotos WHERE id_venta = ? ORDER BY principal DESC, id ASC';

        try {
            const [fotosRows] = await db.execute(fotosQuery, [ventaId]);
            // 3. Adjuntar las fotos encontradas al objeto de la venta
            rows[0].fotos = fotosRows; // Se usa la propiedad 'fotos'
            console.log(`-> Se encontraron ${fotosRows.length} fotos para la venta ID: ${ventaId}`);
        } catch (imgError) {
            console.error(`!!! ERROR AL BUSCAR FOTOS para la venta ${ventaId}:`, imgError.message);
            // Adjuntar un array vacío o un mensaje de error para no romper la respuesta principal
            rows[0].fotos = [];
            rows[0].fotosError = "No se pudieron cargar las fotos.";
        }
    }

    // 4. Enviar la respuesta final con los datos de la venta (y las fotos si aplica)
    res.status(200).json({
      status: "success",
      count: rows.length,
      data: rows, // 'rows' ahora contiene la propiedad 'fotos' si se encontró una venta por ID
      limited: !!maxResults,
      max_results_applied: maxResults || null,
      fields_selected: selectedFields === '*' ? 'all' : requestedFields,
      available_fields: VENTAS_AVAILABLE_FIELDS
    });

  } catch (error) {
    console.error(`!!! ERROR EN EL CONTROLADOR [searchVentas]:`, error.message);
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor al buscar las ventas.",
    });
  }
};