// src/services/csvGenerator.js
import { Parser } from "json2csv";
import fs from "fs/promises";
import path from "path";
import { db } from "../db.js";

/**
 * @description Consulta vehículos en venta, adjunta sus imágenes y genera un archivo CSV.
 * La función sobreescribe el archivo existente cada vez que se ejecuta.
 */
export const generarCsvVehiculosDisponibles = async () => {
  console.log(
    "-> Iniciando la generación del CSV con datos de Ventas, Productos e Imágenes..."
  );

  try {
    // URL base para las imágenes
    const baseUrl = "https://flota.inglosa.hn/uploa_d_ventas/"; // 1. Consulta SQL principal para obtener los datos del vehículo (CORREGIDA)

    const query = `SELECT 
    p.id AS producto_id,
    v.id AS venta_id,
    p.nombre,           -- 👈 AQUI agregamos el nombre del producto
    p.marca, 
    p.modelo, 
    p.anio,
    p.color,
    p.cilindrada,
    p.placa,
    p.chasis,
    v.trasmision,
    v.kilometraje,
    v.precio_venta,
    v.fecha AS fecha_publicacion
FROM 
    ventas AS v
INNER JOIN 
    producto AS p ON v.id_producto = p.id
WHERE 
    v.id_estado = 5 -- El ID que representa "en venta"
ORDER BY 
    p.marca, p.modelo;`;

    const [vehiculosEnVenta] = await db.execute(query);

    if (vehiculosEnVenta.length === 0) {
      console.log(
        "-> No se encontraron vehículos con id_estado = 5. No se generará el CSV."
      );
      return;
    }

    console.log(
      `-> Se encontraron ${vehiculosEnVenta.length} vehículos. Buscando imágenes...`
    ); // 2. Adjuntar las imágenes a los resultados

    const ventaIds = vehiculosEnVenta.map((v) => v.venta_id);
    const placeholders = ventaIds.map(() => "?").join(",");
    const fotosQuery = `SELECT id_venta, nombre_archivo, principal 
        FROM ventas_fotos 
        WHERE id_venta IN (${placeholders}) 
        ORDER BY id_venta, principal DESC, id ASC`;
    const [fotosRows] = await db.execute(fotosQuery, ventaIds);

    const fotosPorVenta = {};
    fotosRows.forEach((foto) => {
      if (!fotosPorVenta[foto.id_venta]) {
        fotosPorVenta[foto.id_venta] = [];
      }
      let esPrincipal =
        foto.principal && Buffer.isBuffer(foto.principal)
          ? foto.principal[0] === 1
          : Boolean(foto.principal);
      fotosPorVenta[foto.id_venta].push({
        nombre_archivo: foto.nombre_archivo || "",
        es_principal: esPrincipal,
      });
    }); // 3. Modificación para añadir la URL base a las imágenes

    vehiculosEnVenta.forEach((vehiculo) => {
      const fotos = fotosPorVenta[vehiculo.venta_id] || [];
      const fotoPrincipal = fotos.find((f) => f.es_principal) || null;
      vehiculo.foto_principal = fotoPrincipal
        ? `${baseUrl}${fotoPrincipal.nombre_archivo}`
        : "";
      const fotosAdicionales = fotos
        .filter((f) => !f.es_principal)
        .map((f) => `${baseUrl}${f.nombre_archivo}`);
      vehiculo.fotos_adicionales = fotosAdicionales.join(", ");
    });

    // Campos para el CSV compatible con catálogo de Meta
    const fields = [
      { label: "id", value: "producto_id" }, // Meta exige "id"
      { label: "title", value: "nombre" }, // Nombre del producto
      {
        label: "description",
        value: (row) =>
          `${row.marca} ${row.modelo} ${row.anio} - ${row.color}, ${row.cilindrada}cc, Transmisión: ${row.trasmision}, Placa: ${row.placa}, Chasis: ${row.chasis}`,
      },
      { label: "availability", value: () => "in stock" },
      { label: "condition", value: () => "used" },
      {
        label: "price",
        value: (row) => `${row.precio_venta} HNL`, // 👈 Importante: precio + moneda
      },
      {
        label: "link",
        value: (row) => `https://flota.inglosa.hn/vehiculo/${row.venta_id}`, // 👈 Ajusta la URL al detalle del vehículo
      },
      { label: "image_link", value: "foto_principal" },
      { label: "additional_image_link", value: "fotos_adicionales" },
      { label: "brand", value: "marca" },
      { label: "model", value: "modelo" },
      { label: "year", value: "anio" },
      { label: "mileage", value: "kilometraje" },
      { label: "color", value: "color" },
    ];

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(vehiculosEnVenta); // 5. Guardar el archivo en el volumen persistente

    const outputPath = path.resolve("/data", "vehiculos_disponibles.csv");
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, csv);

    console.log(`CSV generado exitosamente en: ${outputPath}`);
  } catch (error) {
    console.error("ERROR al generar el archivo CSV:", error);
  }
};
