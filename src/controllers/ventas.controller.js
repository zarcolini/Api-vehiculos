import { db } from "../db.js";
import { filterEmptyParams, processFieldSelection, processLimit } from '../utils/helpers.js';
import { VENTAS_VALID_FIELDS, VENTAS_AVAILABLE_FIELDS } from '../config/fieldMapping.js';
import { buildDynamicQuery } from '../services/queryBuilder.js';

/**
 * @description Busca ventas dinámicamente según los criterios proporcionados.
 * Opcionalmente adjunta las fotos asociadas con una estructura de salida simplificada.
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

  const maxResults = searchParams.max_results;
  const requestedFields = searchParams.fields;
  const includePhotos = searchParams.include_photos === true || searchParams.include_photos === 'true';
  
  delete searchParams.max_results;
  delete searchParams.fields;
  delete searchParams.include_photos;

  console.log(`-> Incluir fotos: ${includePhotos}`);

  const { selectedFields } = processFieldSelection(requestedFields, VENTAS_AVAILABLE_FIELDS);

  const attachPhotosToVentas = async (ventas) => {
    if (!ventas || ventas.length === 0) return ventas;

    try {
      const ventaIds = ventas.map(venta => venta.id);
      if (ventaIds.length === 0) return ventas;

      const placeholders = ventaIds.map(() => '?').join(',');
      
      // FIX: Remove indentation from multi-line SQL query
      const fotosQuery = [
        'SELECT id_venta, nombre_archivo, principal',
        'FROM ventas_fotos',
        `WHERE id_venta IN (${placeholders})`,
        'ORDER BY id_venta, principal DESC, id ASC'
      ].join(' ');

      console.log(`-> Buscando fotos para ${ventaIds.length} ventas...`);
      console.log(`-> Query de fotos: ${fotosQuery}`); // Debug log
      const [fotosRows] = await db.execute(fotosQuery, ventaIds);

      const fotosPorVenta = {};
      fotosRows.forEach(foto => {
        if (!fotosPorVenta[foto.id_venta]) {
          fotosPorVenta[foto.id_venta] = [];
        }
        
        let esPrincipal = false;
        if (foto.principal && Buffer.isBuffer(foto.principal)) {
          esPrincipal = foto.principal[0] === 1;
        } else {
          esPrincipal = Boolean(foto.principal);
        }

        fotosPorVenta[foto.id_venta].push({
          nombre_archivo: foto.nombre_archivo || '',
          es_principal: esPrincipal,
        });
      });

      ventas.forEach(venta => {
        const fotosVenta = fotosPorVenta[venta.id] || [];
        const fotoPrincipalObj = fotosVenta.find(foto => foto.es_principal) || null;
        const fotosSecundariasArr = fotosVenta.filter(foto => !foto.es_principal);
        const nombresFotosAdicionales = fotosSecundariasArr.map(foto => foto.nombre_archivo);
        const fotosAdicionalesString = nombresFotosAdicionales.join(', ');

        venta.imagenes = {
          total: fotosVenta.length,
          foto_principal: fotoPrincipalObj ? fotoPrincipalObj.nombre_archivo : null,
          fotos_adicionales: fotosAdicionalesString
        };
      });

      const ventasConFotos = Object.keys(fotosPorVenta).length;
      const totalFotos = fotosRows.length;
      console.log(`-> Se encontraron ${totalFotos} fotos para ${ventasConFotos} ventas`);
      
      return ventas;

    } catch (error) {
      console.error(`!!! ERROR AL BUSCAR FOTOS:`, error.message);
      console.error(`!!! Stack trace:`, error.stack); // More detailed error info
      ventas.forEach(venta => {
        venta.imagenes = {
          total: 0,
          foto_principal: null,
          fotos_adicionales: "",
          error: "No se pudieron cargar las fotos."
        };
      });
      return ventas;
    }
  };

  if (!searchParams || Object.keys(searchParams).length === 0) {
    console.log("Sin parámetros de búsqueda, devolviendo todas las ventas...");
    try {
      let query = `SELECT ${selectedFields} FROM ventas ORDER BY id DESC`;
      query += processLimit(maxResults);

      const [rows] = await db.execute(query);
      
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
        ...(includePhotos && { photos_note: "Imágenes incluidas con estructura simple" })
      });
    } catch (error) {
      console.error("!!! ERROR AL OBTENER TODAS LAS VENTAS:", error.message);
      return res.status(500).json({
        status: "error",
        message: "Error interno del servidor al obtener las ventas.",
      });
    }
  }

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
      ...(includePhotos && { photos_note: "Imágenes incluidas con estructura simple" })
    });

  } catch (error) {
    console.error(`!!! ERROR EN EL CONTROLADOR [searchVentas]:`, error.message);
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor al buscar las ventas.",
    });
  }
};