import { db } from '../db.js';

export const getVentas = async (req, res) => {
    console.log("-> Solicitud GET en /api/ventas. Consultando la base de datos...");
    try {
        const [rows] = await db.execute('SELECT * FROM ventas');
        console.log(`Número de registros encontrados: ${rows.length}`);
        res.status(200).json({ 
            status: 'success', 
            count: rows.length, 
            data: rows 
        });
    } catch (error) {
        console.error("!!! ERROR EN EL CONTROLADOR [getVentas]:", error.message);
        res.status(500).json({ 
            status: 'error', 
            message: 'Error interno del servidor al obtener las ventas.' 
        });
    }
};

export const getVentaById = async (req, res) => {
    const { id } = req.params;
    console.log(`-> Solicitud GET en /api/ventas/${id}.`);
    
    if (isNaN(id)) {
        return res.status(400).json({ 
            status: 'fail', 
            message: 'El ID proporcionado no es un número válido.' 
        });
    }
    
    try {
        const [rows] = await db.execute('SELECT * FROM ventas WHERE id = ?', [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ 
                status: 'fail', 
                message: 'No se encontró ninguna venta con el ID proporcionado.' 
            });
        }
        
        res.status(200).json({ 
            status: 'success', 
            data: rows[0] 
        });
    } catch (error) {
        console.error(`!!! ERROR EN EL CONTROLADOR [getVentaById] con ID ${id}:`, error.message);
        res.status(500).json({ 
            status: 'error', 
            message: 'Error interno del servidor al obtener la venta.' 
        });
    }
};

export const createVenta = (req, res) => {
    const body = req.body;
    console.log('-> Solicitud POST en /api/ventas. Cuerpo recibido:', body);
    
    if (!body || Object.keys(body).length === 0) {
        return res.status(400).json({ 
            status: 'fail', 
            message: 'El cuerpo de la solicitud (body) no puede estar vacío.' 
        });
    }
    
    res.status(201).json({ 
        status: 'success', 
        message: 'Endpoint POST funciona. Datos recibidos correctamente.', 
        dataReceived: body 
    });
};

/**
 * @description Busca ventas dinámicamente según los criterios proporcionados en el cuerpo de la solicitud.
 * @param {import('express').Request} req Objeto de solicitud de Express.
 * @param {import('express').Response} res Objeto de respuesta de Express.
 */
export const searchVentas = async (req, res) => {
    const searchParams = req.body;
    console.log(`-> Solicitud POST en /api/ventas/search con parámetros:`, searchParams);

    if (!searchParams || Object.keys(searchParams).length === 0) {
        return res.status(400).json({
            status: 'fail',
            message: 'Se requiere al menos un parámetro de búsqueda en el cuerpo de la solicitud.'
        });
    }

    // Mapeo de campos permitidos para MariaDB
    const validFields = {
        id: { column: 'id', operator: '=' },
        precio: { column: 'precio_venta', operator: '=' },
        precio_minimo: { column: 'precio_venta', operator: '>=' },
        precio_maximo: { column: 'precio_venta', operator: '<=' },
        trasmision: { column: 'trasmision', operator: '=' },
        id_estado: { column: 'id_estado', operator: '=' }
    };

    let baseQuery = 'SELECT * FROM ventas WHERE 1=1';
    const queryParams = [];

    // Construye la consulta dinámicamente
    for (const key in searchParams) {
        if (validFields[key]) {
            const fieldConfig = validFields[key];
            const value = searchParams[key];
            
            baseQuery += ` AND ${fieldConfig.column} ${fieldConfig.operator} ?`;
            queryParams.push(value);
        } else {
            console.warn(`ADVERTENCIA: Campo de búsqueda no válido '${key}' ha sido ignorado.`);
        }
    }
    
    console.log(`Consulta SQL a ejecutar: ${baseQuery}`);
    console.log(`Parámetros: [${queryParams.join(', ')}]`);

    try {
        const [rows] = await db.execute(baseQuery, queryParams);

        if (rows.length === 0) {
            return res.status(404).json({
                status: 'fail',
                message: 'No se encontraron ventas con los criterios de búsqueda proporcionados.'
            });
        }
        
        res.status(200).json({
            status: 'success',
            count: rows.length,
            data: rows
        });
    } catch (error) {
        console.error(`!!! ERROR EN EL CONTROLADOR [searchVentas]:`, error.message);
        res.status(500).json({
            status: 'error',
            message: 'Error interno del servidor al buscar las ventas.'
        });
    }
};

/**
 * @description Obtiene la lista de todas las tablas disponibles en la base de datos.
 * @param {import('express').Request} req Objeto de solicitud de Express.
 * @param {import('express').Response} res Objeto de respuesta de Express.
 */
export const getTables = async (req, res) => {
    console.log("-> Solicitud GET en /api/tables. Consultando tablas de la base de datos...");
    
    try {
        // Consulta para obtener todas las tablas de la base de datos actual
        const [rows] = await db.execute('SHOW TABLES');
        
        // Extraer solo los nombres de las tablas del resultado
        const tableNames = rows.map(row => Object.values(row)[0]);
        
        console.log(`Número de tablas encontradas: ${tableNames.length}`);
        console.log(`Tablas: ${tableNames.join(', ')}`);
        
        res.status(200).json({
            status: 'success',
            count: tableNames.length,
            data: {
                tables: tableNames,
                details: rows
            }
        });
    } catch (error) {
        console.error("!!! ERROR EN EL CONTROLADOR [getTables]:", error.message);
        res.status(500).json({
            status: 'error',
            message: 'Error interno del servidor al obtener las tablas de la base de datos.'
        });
    }
};

/**
 * @description Obtiene la estructura (campos, tipos, etc.) de una tabla específica.
 * @param {import('express').Request} req Objeto de solicitud de Express.
 * @param {import('express').Response} res Objeto de respuesta de Express.
 */
export const getTableStructure = async (req, res) => {
    const { tableName } = req.params;
    console.log(`-> Solicitud GET en /api/table-structure/${tableName}. Consultando estructura de la tabla...`);
    
    if (!tableName || tableName.trim() === '') {
        return res.status(400).json({
            status: 'fail',
            message: 'El nombre de la tabla es requerido.'
        });
    }
    
    // Validar que el nombre de tabla solo contenga caracteres válidos (seguridad)
    const tableNameRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    if (!tableNameRegex.test(tableName)) {
        return res.status(400).json({
            status: 'fail',
            message: 'El nombre de la tabla contiene caracteres no válidos.'
        });
    }
    
    try {
        // Para MariaDB, construimos la consulta directamente (de forma segura después de validar)
        const query = `DESCRIBE ${tableName}`;
        console.log(`Ejecutando consulta: ${query}`);
        
        const [rows] = await db.execute(query);
        
        if (rows.length === 0) {
            return res.status(404).json({
                status: 'fail',
                message: `La tabla '${tableName}' no existe o no tiene columnas.`
            });
        }
        
        // Formatear la información de manera más legible
        const tableInfo = rows.map(row => ({
            field: row.Field,
            type: row.Type,
            null: row.Null,
            key: row.Key,
            default: row.Default,
            extra: row.Extra
        }));
        
        console.log(`Estructura de tabla '${tableName}' obtenida. Campos encontrados: ${rows.length}`);
        
        res.status(200).json({
            status: 'success',
            tableName: tableName,
            fieldsCount: rows.length,
            data: {
                structure: tableInfo,
                rawData: rows
            }
        });
    } catch (error) {
        console.error(`!!! ERROR EN EL CONTROLADOR [getTableStructure] para tabla '${tableName}':`, error.message);
        
        // Si el error es porque la tabla no existe
        if (error.code === 'ER_NO_SUCH_TABLE' || error.message.includes("doesn't exist")) {
            return res.status(404).json({
                status: 'fail',
                message: `La tabla '${tableName}' no existe en la base de datos.`
            });
        }
        
        res.status(500).json({
            status: 'error',
            message: 'Error interno del servidor al obtener la estructura de la tabla.'
        });
    }
};