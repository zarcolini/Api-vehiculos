import { db } from "../db.js";
import { filterEmptyParams, processFieldSelection, processLimit } from '../utils/helpers.js';
import { VENTAS_VALID_FIELDS, VENTAS_AVAILABLE_FIELDS } from '../config/fieldMapping.js';
import { buildDynamicQuery } from '../services/queryBuilder.js';

/**
 * @description Busca ventas dinámicamente según los criterios proporcionados.
 * Opcionalmente adjunta las fotos asociadas según el parámetro include_photos.
 * Optimizado para MariaDB.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const searchVentas = async (req, res) => {
  let originalParams = req.body;
  console.log(
    `-> Solicitud POST en /api/ventas/search con parámetros:`,
    originalParams
  );

  originalParams = filterEmptyParams(originalParams);
  console.log(`-> Parámetros después de filtrar vacíos:`, originalParams);

  const searchParams = { ...originalParams };

  // Extraer parámetros de control
  const maxResults = searchParams.max_results;
  const requestedFields = searchParams.fields;
  const includePhotos = searchParams.include_photos === true || searchParams.include_photos === 'true';
  
  // Limpiar parámetros de control antes de la búsqueda
  delete searchParams.max_results;
  delete searchParams.fields;
  delete searchParams.include_photos;

  console.log(`-> Incluir fotos: ${includePhotos}`);

  const { selectedFields } = processFieldSelection(requestedFields, VENTAS_AVAILABLE_FIELDS);

  /**
   * Función auxiliar para obtener fotos de múltiples ventas
   * Optimizada para MariaDB - maneja correctamente el tipo bit(1)
   * @param {Array} ventas - Array de ventas
   * @returns {Array} - Array de ventas con fotos adjuntas
   */
  const attachPhotosToVentas = async (ventas) => {
    if (!ventas || ventas.length === 0) return ventas;

    try {
      // Obtener todos los IDs de ventas
      const ventaIds = ventas.map(venta => venta.id);
      
      if (ventaIds.length === 0) return ventas;

      // Crear placeholders para la consulta IN
      const placeholders = ventaIds.map(() => '?').join(',');
      
      // Consulta para obtener todas las fotos de las ventas encontradas
      const fotosQuery = `
        SELECT id_venta, id, nombre_archivo, principal, fecha 
        FROM ventas_fotos 
        WHERE id_venta IN (${placeholders}) 
        ORDER BY id_venta, principal DESC, id ASC
      `;

      console.log(`-> Buscando fotos para ${ventaIds.length} ventas...`);
      const [fotosRows] = await db.execute(fotosQuery, ventaIds);

      // Agrupar fotos por id_venta
      const fotosPorVenta = {};
      fotosRows.forEach(foto => {
        if (!fotosPorVenta[foto.id_venta]) {
          fotosPorVenta[foto.id_venta] = [];
        }
        
        // Convertir el Buffer del campo bit(1) de MariaDB a boolean
        let esPrincipal = false;
        if (foto.principal) {
          if (Buffer.isBuffer(foto.principal)) {
            // MariaDB bit(1) devuelve Buffer, el primer byte indica el valor
            esPrincipal = foto.principal[0] === 1;
          } else if (typeof foto.principal === 'number') {
            esPrincipal = foto.principal === 1;
          } else {
            esPrincipal = Boolean(foto.principal);
          }
        }

        // Limpiar nombre de archivo decodificando URL encoding
        let nombreArchivo = foto.nombre_archivo || '';
        try {
          nombreArchivo = decodeURIComponent(nombreArchivo);
        } catch (e) {
          // Si falla la decodificación, mantener el original
          console.warn(`No se pudo decodificar: ${nombreArchivo}`);
        }

        fotosPorVenta[foto.id_venta].push({
          id: foto.id,
          nombre_archivo: nombreArchivo,
          es_principal: esPrincipal,
          fecha_subida: foto.fecha
        });
      });

      // Adjuntar fotos a cada venta y organizar mejor la estructura
      ventas.forEach(venta => {
        const fotosVenta = fotosPorVenta[venta.id] || [];
        
        // Separar foto principal de las demás
        const fotoPrincipal = fotosVenta.find(foto => foto.es_principal) || null;
        const fotosSecundarias = fotosVenta.filter(foto => !foto.es_principal);
        
        // Organizar las fotos de manera más útil
        venta.imagenes = {
          total: fotosVenta.length,
          foto_principal: fotoPrincipal,
          fotos_adicionales: fotosSecundarias,
          todas_las_fotos: fotosVenta
        };
      });

      const ventasConFotos = Object.keys(fotosPorVenta).length;
      const totalFotos = fotosRows.length;
      console.log(`-> Se encontraron ${totalFotos} fotos para ${ventasConFotos} ventas`);
      
      return ventas;

    } catch (error) {
      console.error(`!!! ERROR AL BUSCAR FOTOS:`, error.message);
      // En caso de error, agregar estructura de imágenes vacía
      ventas.forEach(venta => {
        venta.imagenes = {
          total: 0,
          foto_principal: null,
          fotos_adicionales: [],
          error: "No se pudieron cargar las fotos."
        };
      });
      return ventas;
    }
  };

  // Caso sin parámetros de búsqueda - devolver todas las ventas
  if (!searchParams || Object.keys(searchParams).length === 0) {
    console.log("Sin parámetros de búsqueda, devolviendo todas las ventas...");
    try {
      let query = `SELECT ${selectedFields} FROM ventas ORDER BY id DESC`;
      query += processLimit(maxResults);

      const [rows] = await db.execute(query);
      
      // Adjuntar fotos solo si se solicita
      let finalData = rows;
      if (includePhotos) {
        finalData = await attachPhotosToVentas(rows);
      }

      return res.status(200).json({
        status: "success",
        count: finalData.length,
        data: finalData,
        message: "Todas las ventas (sin filtros aplicados)",
        limited: !!maxResults,
        max_results_applied: maxResults || null,
        fields_selected: selectedFields === '*' ? 'all' : requestedFields,
        photos_included: includePhotos,
        ...(includePhotos && { photos_note: "Imágenes incluidas con estructura mejorada" })
      });
    } catch (error) {
      console.error("!!! ERROR AL OBTENER TODAS LAS VENTAS:", error.message);
      return res.status(500).json({
        status: "error",
        message: "Error interno del servidor al obtener las ventas.",
      });
    }
  }

  // Caso con parámetros de búsqueda
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
    const [rows] = await db.execute(finalQuery, queryParams);

    if (rows.length === 0) {
      return res.status(404).json({
        status: "fail",
        message: "No se encontraron ventas con los criterios de búsqueda proporcionados.",
        photos_included: includePhotos
      });
    }

    // Adjuntar fotos solo si se solicita
    let finalData = rows;
    if (includePhotos) {
      finalData = await attachPhotosToVentas(rows);
    }

    res.status(200).json({
      status: "success",
      count: finalData.length,
      data: finalData,
      limited: !!maxResults,
      max_results_applied: maxResults || null,
      fields_selected: selectedFields === '*' ? 'all' : requestedFields,
      available_fields: VENTAS_AVAILABLE_FIELDS,
      photos_included: includePhotos,
      ...(includePhotos && { photos_note: "Imágenes incluidas con estructura mejorada" })
    });

  } catch (error) {
    console.error(`!!! ERROR EN EL CONTROLADOR [searchVentas]:`, error.message);
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor al buscar las ventas.",
    });
  }
};