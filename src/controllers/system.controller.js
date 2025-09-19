import { db } from "../db.js";
import { filterEmptyParams } from '../utils/helpers.js';
import path from 'path';
import fs from 'fs';

/**
 * Obtiene todas las tablas de la BD
 */
export const getTables = async (req, res) => {
    console.log("-> GET /api/tables");

    try {
        const [rows] = await db.execute("SHOW TABLES");
        const tableNames = rows.map((row) => Object.values(row)[0]);

        console.log(`Tablas encontradas: ${tableNames.length}`);

        res.status(200).json({
            status: "success",
            count: tableNames.length,
            data: {
                tables: tableNames,
                details: rows,
            },
        });
    } catch (error) {
        console.error("ERROR en getTables:", error.message);
        res.status(500).json({
            status: "error",
            message: "Error interno del servidor",
        });
    }
};

/**
 * Obtiene la estructura de una tabla
 */
export const getTableStructure = async (req, res) => {
    let requestBody = req.body;
    requestBody = filterEmptyParams(requestBody);
    
    const { tableName } = requestBody;
    console.log(`-> POST /api/table-structure: ${tableName}`);

    if (!tableName || tableName.trim() === "") {
        return res.status(400).json({
            status: "fail",
            message: "El nombre de la tabla es requerido",
        });
    }

    const tableNameRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    if (!tableNameRegex.test(tableName)) {
        return res.status(400).json({
            status: "fail",
            message: "Nombre de tabla no válido",
        });
    }

    try {
        const query = `DESCRIBE ${tableName}`;
        const [rows] = await db.execute(query);

        if (rows.length === 0) {
            return res.status(404).json({
                status: "fail",
                message: `La tabla '${tableName}' no existe`,
            });
        }

        const tableInfo = rows.map((row) => ({
            field: row.Field,
            type: row.Type,
            null: row.Null,
            key: row.Key,
            default: row.Default,
            extra: row.Extra,
        }));

        res.status(200).json({
            status: "success",
            tableName: tableName,
            fieldsCount: rows.length,
            data: {
                structure: tableInfo,
                rawData: rows,
            },
        });
    } catch (error) {
        console.error(`ERROR en getTableStructure:`, error.message);

        if (error.code === "ER_NO_SUCH_TABLE" || error.message.includes("doesn't exist")) {
            return res.status(404).json({
                status: "fail",
                message: `La tabla '${tableName}' no existe`,
            });
        }

        res.status(500).json({
            status: "error",
            message: "Error interno del servidor",
        });
    }
};

/**
 * Maneja la descarga del archivo CSV de vehículos disponibles.
 */
export const downloadCsvVehiculos = (req, res) => {
    try {
        const filePath = path.resolve(process.cwd(), '/data', 'vehiculos_disponibles.csv');

        if (!fs.existsSync(filePath)) {
            console.log(`-> Intento de descarga fallido: Archivo no encontrado en ${filePath}`);
            return res.status(404).json({
                status: 'error',
                message: 'El archivo CSV no ha sido generado todavía o no se encuentra.'
            });
        }
        
        console.log(`-> Solicitud de descarga para: ${filePath}`);
        
        res.download(filePath, 'vehiculos_en_venta.csv', (err) => {
            if (err) {
                console.error('Error durante la descarga del archivo:', err);
            }
        });

    } catch (error) {
        console.error('Error en el controlador de descarga:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error interno del servidor al intentar descargar el archivo.'
        });
    }
};