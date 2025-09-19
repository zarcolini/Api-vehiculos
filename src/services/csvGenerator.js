// src/services/csvGenerator.js
import { Parser } from 'json2csv';
import fs from 'fs/promises';
import path from 'path';
import { db } from '../db.js'; // Asegúrate que la ruta a tu conexión DB sea correcta

/**
 * @description Consulta vehículos marcados como "en venta" (id_estado = 5 en la tabla 'ventas'),
 * combina la información con la tabla 'producto' y genera un archivo CSV.
 * La función sobreescribe el archivo existente cada vez que se ejecuta.
 */
export const generarCsvVehiculosDisponibles = async () => {
    console.log('-> Iniciando la generación del CSV con datos de Ventas y Productos...');

    try {
        // 1. Obtener los datos combinados con un INNER JOIN
        // Esta consulta une 'ventas' y 'producto' donde el id_producto coincida.
        // Filtra únicamente por las ventas que tienen el estado 5.
        const query = `
            SELECT 
                p.id AS producto_id,
                v.id AS venta_id,
                p.marca, 
                p.modelo, 
                p.anio,
                p.condicion,
                p.tipo_combustible,
                p.transmision,
                p.kilometraje,
                v.precio AS precio_venta,  -- Asumo que el precio está en la tabla 'ventas'
                v.fecha_publicacion,
                p.cilindraje,
                p.color_exterior
            FROM 
                ventas AS v
            INNER JOIN 
                producto AS p ON v.id_producto = p.id
            WHERE 
                v.id_estado = 5 -- El ID que representa "en venta"
            ORDER BY 
                p.marca, p.modelo;
        `;

        const [vehiculosEnVenta] = await db.execute(query);

        if (vehiculosEnVenta.length === 0) {
            console.log('-> No se encontraron vehículos con id_estado = 5. No se generará el CSV.');
            return;
        }

        console.log(`-> Se encontraron ${vehiculosEnVenta.length} vehículos para el CSV.`);

        // 2. Definir las columnas y cabeceras del CSV
        // ¡IMPORTANTE! El 'value' debe coincidir con los nombres/alias de las columnas en el SELECT.
        const fields = [
            { label: 'ID Producto', value: 'producto_id' },
            { label: 'ID Venta', value: 'venta_id' },
            { label: 'Marca', value: 'marca' },
            { label: 'Modelo', value: 'modelo' },
            { label: 'Año', value: 'anio' },
            { label: 'Precio de Venta (USD)', value: 'precio_venta' },
            { label: 'Condición', value: 'condicion' },
            { label: 'Kilometraje', value: 'kilometraje' },
            { label: 'Combustible', value: 'tipo_combustible' },
            { label: 'Transmisión', value: 'transmision' },
            { label: 'Cilindraje', value: 'cilindraje' },
            { label: 'Color', value: 'color_exterior' },
            { label: 'Fecha de Publicación', value: 'fecha_publicacion' }
        ];

        // 3. Convertir los datos JSON a formato CSV
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(vehiculosEnVenta);

        // 4. Guardar el archivo CSV en una carpeta pública
        const outputPath = path.resolve(process.cwd(), '/Data', 'vehiculos_disponibles.csv');
        
        // Asegurarse de que el directorio 'public' exista
        await fs.mkdir(path.dirname(outputPath), { recursive: true });
        await fs.writeFile(outputPath, csv);

        console.log(` CSV generado exitosamente en: ${outputPath}`);

    } catch (error) {
        console.error('!!! ERROR al generar el archivo CSV:', error);
    }
};