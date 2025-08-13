import { db } from '../db.js';

/**
 * @description Busca ventas dinámicamente según los criterios proporcionados en el cuerpo de la solicitud.
 * @param {import('express').Request} req Objeto de solicitud de Express.
 * @param {import('express').Response} res Objeto de respuesta de Express.
 */
export const searchVentas = async (req, res) => {
    const searchParams = req.body;
    console.log(`-> Solicitud POST en /api/ventas/search con parámetros:`, searchParams);

    // Si no hay parámetros, devolver todas las ventas
    if (!searchParams || Object.keys(searchParams).length === 0) {
        console.log("Sin parámetros de búsqueda, devolviendo todas las ventas...");
        try {
            const [rows] = await db.execute('SELECT * FROM ventas ORDER BY id DESC');
            return res.status(200).json({
                status: 'success',
                count: rows.length,
                data: rows,
                message: 'Todas las ventas (sin filtros aplicados)'
            });
        } catch (error) {
            console.error("!!! ERROR AL OBTENER TODAS LAS VENTAS:", error.message);
            return res.status(500).json({
                status: 'error',
                message: 'Error interno del servidor al obtener las ventas.'
            });
        }
    }

    // Extraer max_results si existe
    const maxResults = searchParams.max_results;
    delete searchParams.max_results; // Remover del objeto para que no interfiera con la búsqueda

    // Mapeo de campos permitidos para MariaDB
    const validFields = {
        id: { column: 'id', operator: '=' },
        ids: { column: 'id', operator: 'IN' }, // Para múltiples IDs
        precio: { column: 'precio_venta', operator: '=' },
        precio_minimo: { column: 'precio_venta', operator: '>=' },
        precio_maximo: { column: 'precio_venta', operator: '<=' },
        trasmision: { column: 'trasmision', operator: '=' },
        id_estado: { column: 'id_estado', operator: '=' },
        // Campos adicionales si existen en la tabla ventas
        fecha_venta: { column: 'fecha_venta', operator: '=' },
        fecha_desde: { column: 'fecha_venta', operator: '>=' },
        fecha_hasta: { column: 'fecha_venta', operator: '<=' }
    };

    let baseQuery = 'SELECT * FROM ventas WHERE 1=1';
    const queryParams = [];

    // Construye la consulta dinámicamente
    for (const key in searchParams) {
        if (validFields[key]) {
            const fieldConfig = validFields[key];
            const value = searchParams[key];
            
            if (key === 'ids' && Array.isArray(value)) {
                // Manejo especial para array de IDs
                const placeholders = value.map(() => '?').join(',');
                baseQuery += ` AND ${fieldConfig.column} IN (${placeholders})`;
                queryParams.push(...value);
            } else {
                baseQuery += ` AND ${fieldConfig.column} ${fieldConfig.operator} ?`;
                queryParams.push(value);
            }
        } else {
            console.warn(`ADVERTENCIA: Campo de búsqueda no válido '${key}' ha sido ignorado.`);
        }
    }
    
    // Agregar ordenamiento
    baseQuery += ' ORDER BY id DESC';
    
    // Agregar límite si se especifica - VALIDACIÓN MEJORADA
    if (maxResults) {
        const limitValue = Number(maxResults);
        if (limitValue > 0 && Number.isInteger(limitValue)) {
            baseQuery += ' LIMIT ?';
            queryParams.push(limitValue);
            console.log(`Aplicando límite de ${limitValue} resultados`);
        } else {
            console.log(`max_results inválido (${maxResults}), ignorando límite`);
        }
    }
    
    console.log(`Consulta SQL a ejecutar: ${baseQuery}`);
    console.log(`Parámetros finales: [${queryParams.map(p => `${p} (${typeof p})`).join(', ')}]`);

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
            data: rows,
            limited: maxResults ? true : false,
            max_results_applied: maxResults || null
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
 * @description Obtiene la estructura de una tabla específica usando JSON.
 * @param {import('express').Request} req Objeto de solicitud de Express.
 * @param {import('express').Response} res Objeto de respuesta de Express.
 */
export const getTableStructure = async (req, res) => {
    const { tableName } = req.body;
    console.log(`-> Solicitud POST en /api/table-structure con tabla: ${tableName}`);
    
    if (!tableName || tableName.trim() === '') {
        return res.status(400).json({
            status: 'fail',
            message: 'El nombre de la tabla es requerido en el cuerpo de la solicitud.'
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

// =====================================================
// ENDPOINTS DE PRODUCTOS
// =====================================================

/**
 * @description Busca productos dinámicamente según los criterios proporcionados en el cuerpo de la solicitud.
 * @param {import('express').Request} req Objeto de solicitud de Express.
 * @param {import('express').Response} res Objeto de respuesta de Express.
 */
export const searchProductos = async (req, res) => {
    const originalParams = req.body;
    console.log(`-> Solicitud POST en /api/productos/search con parámetros:`, originalParams);

    // Crear una copia del objeto para no modificar el original
    const searchParams = { ...originalParams };
    
    // Extraer max_results si existe
    const maxResults = searchParams.max_results;
    delete searchParams.max_results; // Remover del objeto para que no interfiera con la búsqueda

    // Si no hay parámetros, devolver todos los productos
    if (!searchParams || Object.keys(searchParams).length === 0) {
        console.log("Sin parámetros de búsqueda, devolviendo todos los productos...");
        try {
            let query = 'SELECT * FROM producto ORDER BY id DESC';
            const queryParams = [];
            
            // Agregar límite si se especifica - CORREGIR VALIDACIÓN
            if (maxResults && Number(maxResults) > 0) {
                query += ' LIMIT ?';
                queryParams.push(Number(maxResults));
                console.log(`Aplicando límite de ${maxResults} resultados`);
            }
            
            const [rows] = await db.execute(query, queryParams);
            return res.status(200).json({
                status: 'success',
                count: rows.length,
                data: rows,
                message: 'Todos los productos (sin filtros aplicados)',
                limited: maxResults ? true : false,
                max_results_applied: maxResults || null
            });
        } catch (error) {
            console.error("!!! ERROR AL OBTENER TODOS LOS PRODUCTOS:", error.message);
            return res.status(500).json({
                status: 'error',
                message: 'Error interno del servidor al obtener los productos.'
            });
        }
    }

    // Mapeo de campos permitidos para búsqueda de productos/vehículos
    const validFields = {
        // Identificación
        id: { column: 'id', operator: '=' },
        ids: { column: 'id', operator: 'IN' }, // Para múltiples IDs
        codigo_alterno: { column: 'codigo_alterno', operator: 'LIKE' },
        nombre: { column: 'nombre', operator: 'LIKE' },
        
        // Especificaciones del vehículo
        marca: { column: 'marca', operator: 'LIKE' },
        anio: { column: 'anio', operator: '=' },
        anio_desde: { column: 'anio', operator: '>=' },
        anio_hasta: { column: 'anio', operator: '<=' },
        modelo: { column: 'modelo', operator: 'LIKE' },
        color: { column: 'color', operator: 'LIKE' },
        cilindrada: { column: 'cilindrada', operator: 'LIKE' },
        tipo_vehiculo: { column: 'tipo_vehiculo', operator: 'LIKE' },
        
        // Identificadores del vehículo
        serie: { column: 'serie', operator: 'LIKE' },
        motor: { column: 'motor', operator: 'LIKE' },
        placa: { column: 'placa', operator: 'LIKE' },
        chasis: { column: 'chasis', operator: 'LIKE' },
        
        // Precios
        precio_costo: { column: 'precio_costo', operator: '=' },
        precio_costo_minimo: { column: 'precio_costo', operator: '>=' },
        precio_costo_maximo: { column: 'precio_costo', operator: '<=' },
        precio_venta: { column: 'precio_venta', operator: '=' },
        precio_venta_minimo: { column: 'precio_venta', operator: '>=' },
        precio_venta_maximo: { column: 'precio_venta', operator: '<=' },
        
        // Kilometraje y horas
        km: { column: 'km', operator: '=' },
        km_minimo: { column: 'km', operator: '>=' },
        km_maximo: { column: 'km', operator: '<=' },
        horas: { column: 'horas', operator: '=' },
        horas_minimo: { column: 'horas', operator: '>=' },
        horas_maximo: { column: 'horas', operator: '<=' },
        
        // Estados y tipos
        habilitado: { column: 'habilitado', operator: '=' },
        congelado: { column: 'congelado', operator: '=' },
        item_venta: { column: 'item_venta', operator: '=' },
        item_compra: { column: 'item_compra', operator: '=' },
        item_inventario: { column: 'item_inventario', operator: '=' },
        tipo: { column: 'tipo', operator: '=' },
        tipo_mant: { column: 'tipo_mant', operator: '=' },
        
        // Otros
        codigo_grupo: { column: 'codigo_grupo', operator: 'LIKE' },
        clase: { column: 'clase', operator: 'LIKE' }
    };

    let baseQuery = 'SELECT * FROM producto WHERE 1=1';
    const queryParams = [];

    console.log('Parámetros después de remover max_results:', searchParams);
    console.log('maxResults extraído:', maxResults);

    // Construye la consulta dinámicamente
    for (const key in searchParams) {
        if (validFields[key]) {
            const fieldConfig = validFields[key];
            const value = searchParams[key];
            
            console.log(`Procesando campo: ${key} = ${value} (tipo: ${typeof value})`);
            
            if (key === 'ids' && Array.isArray(value)) {
                // Manejo especial para array de IDs
                const placeholders = value.map(() => '?').join(',');
                baseQuery += ` AND ${fieldConfig.column} IN (${placeholders})`;
                queryParams.push(...value);
                console.log(`Array de IDs agregado: ${value}`);
            } else if (fieldConfig.operator === 'LIKE') {
                baseQuery += ` AND ${fieldConfig.column} ${fieldConfig.operator} ?`;
                queryParams.push(`%${value}%`);
                console.log(`LIKE agregado: %${value}%`);
            } else {
                baseQuery += ` AND ${fieldConfig.column} ${fieldConfig.operator} ?`;
                queryParams.push(value);
                console.log(`Valor exacto agregado: ${value} (tipo: ${typeof value})`);
            }
        } else {
            console.warn(`ADVERTENCIA: Campo de búsqueda no válido '${key}' ha sido ignorado.`);
        }
    }
    
    // Agregar ordenamiento
    baseQuery += ' ORDER BY id DESC';
    
    // Agregar límite si se especifica - CORREGIR VALIDACIÓN
    if (maxResults && Number(maxResults) > 0) {
        baseQuery += ' LIMIT ?';
        queryParams.push(Number(maxResults));
        console.log(`Aplicando límite de ${maxResults} resultados`);
    }
    
    console.log(`Consulta SQL a ejecutar: ${baseQuery}`);
    console.log(`Parámetros: [${queryParams.join(', ')}]`);

    try {
        // Validar parámetros antes de ejecutar la consulta
        console.log('Validando parámetros antes de la consulta:');
        queryParams.forEach((param, index) => {
            console.log(`Parámetro ${index}: ${param} (${typeof param})`);
        });

        const [rows] = await db.execute(baseQuery, queryParams);

        if (rows.length === 0) {
            return res.status(404).json({
                status: 'fail',
                message: 'No se encontraron productos con los criterios de búsqueda proporcionados.'
            });
        }
        
        res.status(200).json({
            status: 'success',
            count: rows.length,
            data: rows,
            limited: maxResults ? true : false,
            max_results_applied: maxResults || null
        });
    } catch (error) {
        console.error(`!!! ERROR EN EL CONTROLADOR [searchProductos]:`, error.message);
        console.error(`Query que falló: ${baseQuery}`);
        console.error(`Parámetros que fallaron: [${queryParams.map(p => `${p} (${typeof p})`).join(', ')}]`);
        console.error('Error completo:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error interno del servidor al buscar los productos.'
        });
    }
};

/**
 * @description Obtiene productos disponibles para venta usando JSON para filtros opcionales.
 * @param {import('express').Request} req Objeto de solicitud de Express.
 * @param {import('express').Response} res Objeto de respuesta de Express.
 */
export const getProductosDisponibles = async (req, res) => {
    const filters = req.body || {};
    console.log("-> Solicitud POST en /api/productos/disponibles con filtros:", filters);
    
    // Extraer max_results si existe
    const maxResults = filters.max_results;
    delete filters.max_results; // Remover del objeto para que no interfiera con la búsqueda
    
    try {
        let baseQuery = `
            SELECT p.*, 
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
        
        // Agregar filtros adicionales si se proporcionan
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
        
        baseQuery += ` ORDER BY p.id DESC`;
        
        // Agregar límite si se especifica - CORREGIR VALIDACIÓN
        if (maxResults && Number(maxResults) > 0) {
            baseQuery += ' LIMIT ?';
            queryParams.push(Number(maxResults));
            console.log(`Aplicando límite de ${maxResults} resultados`);
        }
        
        const [rows] = await db.execute(baseQuery, queryParams);
        
        console.log(`Productos disponibles encontrados: ${rows.length}`);
        
        res.status(200).json({
            status: 'success',
            count: rows.length,
            data: rows,
            message: 'Productos disponibles para venta (no vendidos, habilitados, no congelados)',
            limited: maxResults ? true : false,
            max_results_applied: maxResults || null
        });
    } catch (error) {
        console.error("!!! ERROR EN EL CONTROLADOR [getProductosDisponibles]:", error.message);
        res.status(500).json({
            status: 'error',
            message: 'Error interno del servidor al obtener productos disponibles.'
        });
    }
};

/**
 * @description Obtiene productos vendidos con filtros opcionales usando JSON.
 * @param {import('express').Request} req Objeto de solicitud de Express.
 * @param {import('express').Response} res Objeto de respuesta de Express.
 */
export const getProductosVendidos = async (req, res) => {
    const filters = req.body || {};
    console.log("-> Solicitud POST en /api/productos/vendidos con filtros:", filters);
    
    // Extraer max_results si existe
    const maxResults = filters.max_results;
    delete filters.max_results; // Remover del objeto para que no interfiera con la búsqueda
    
    try {
        let baseQuery = `
            SELECT p.*, 
                   v.id as venta_id,
                   v.precio_venta as precio_vendido,
                   v.fecha_venta,
                   'Vendido' as estado_venta
            FROM producto p 
            INNER JOIN ventas v ON p.id = v.producto_id 
            WHERE 1=1
        `;
        
        const queryParams = [];
        
        // Agregar filtros adicionales si se proporcionan
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
            baseQuery += ` AND v.fecha_venta >= ?`;
            queryParams.push(filters.fecha_venta_desde);
        }
        if (filters.fecha_venta_hasta) {
            baseQuery += ` AND v.fecha_venta <= ?`;
            queryParams.push(filters.fecha_venta_hasta);
        }
        
        baseQuery += ` ORDER BY v.fecha_venta DESC`;
        
        // Agregar límite si se especifica - CORREGIR VALIDACIÓN
        if (maxResults && Number(maxResults) > 0) {
            baseQuery += ' LIMIT ?';
            queryParams.push(Number(maxResults));
            console.log(`Aplicando límite de ${maxResults} resultados`);
        }
        
        const [rows] = await db.execute(baseQuery, queryParams);
        
        console.log(`Productos vendidos encontrados: ${rows.length}`);
        
        res.status(200).json({
            status: 'success',
            count: rows.length,
            data: rows,
            message: 'Productos que ya han sido vendidos',
            limited: maxResults ? true : false,
            max_results_applied: maxResults || null
        });
    } catch (error) {
        console.error("!!! ERROR EN EL CONTROLADOR [getProductosVendidos]:", error.message);
        res.status(500).json({
            status: 'error',
            message: 'Error interno del servidor al obtener productos vendidos.'
        });
    }
};

/**
 * @description Verifica el estado de venta de productos usando JSON con IDs o criterios.
 * @param {import('express').Request} req Objeto de solicitud de Express.
 * @param {import('express').Response} res Objeto de respuesta de Express.
 */
export const getEstadoVentaProducto = async (req, res) => {
    const searchParams = req.body;
    console.log(`-> Solicitud POST en /api/productos/estado-venta con parámetros:`, searchParams);

    if (!searchParams || Object.keys(searchParams).length === 0) {
        return res.status(400).json({
            status: 'fail',
            message: 'Se requiere al menos un parámetro de búsqueda en el cuerpo de la solicitud.'
        });
    }

    // Extraer max_results si existe
    const maxResults = searchParams.max_results;
    delete searchParams.max_results; // Remover del objeto para que no interfiera con la búsqueda

    // Mapeo de campos permitidos para búsqueda de estado
    const validFields = {
        id: { column: 'p.id', operator: '=' },
        ids: { column: 'p.id', operator: 'IN' }, // Para múltiples IDs
        codigo_alterno: { column: 'p.codigo_alterno', operator: 'LIKE' },
        nombre: { column: 'p.nombre', operator: 'LIKE' },
        marca: { column: 'p.marca', operator: 'LIKE' },
        modelo: { column: 'p.modelo', operator: 'LIKE' },
        placa: { column: 'p.placa', operator: 'LIKE' },
        serie: { column: 'p.serie', operator: 'LIKE' },
        estado_venta: { column: 'estado_calculado', operator: '=' }, // Campo especial
        disponible_para_venta: { column: 'disponible_calculado', operator: '=' } // Campo especial
    };

    let baseQuery = `
        SELECT p.*,
               v.id as venta_id,
               v.precio_venta as precio_vendido,
               v.fecha_venta,
               CASE 
                   WHEN v.producto_id IS NOT NULL THEN 'Vendido'
                   WHEN p.congelado = 1 THEN 'Congelado'
                   WHEN p.item_venta = 0 THEN 'No disponible para venta'
                   WHEN p.habilitado = 0 THEN 'Deshabilitado'
                   ELSE 'Disponible'
               END as estado_venta,
               CASE 
                   WHEN v.producto_id IS NOT NULL THEN false
                   WHEN p.congelado = 1 OR p.item_venta = 0 OR p.habilitado = 0 THEN false
                   ELSE true
               END as disponible_para_venta
        FROM producto p 
        LEFT JOIN ventas v ON p.id = v.producto_id 
        WHERE 1=1
    `;
    
    const queryParams = [];

    // Construye la consulta dinámicamente
    for (const key in searchParams) {
        if (validFields[key]) {
            const fieldConfig = validFields[key];
            const value = searchParams[key];
            
            if (key === 'ids' && Array.isArray(value)) {
                // Manejo especial para array de IDs
                const placeholders = value.map(() => '?').join(',');
                baseQuery += ` AND ${fieldConfig.column} IN (${placeholders})`;
                queryParams.push(...value);
            } else if (key === 'estado_venta') {
                // Manejo especial para estado de venta
                if (value === 'Vendido') {
                    baseQuery += ` AND v.producto_id IS NOT NULL`;
                } else if (value === 'Disponible') {
                    baseQuery += ` AND v.producto_id IS NULL AND p.congelado = 0 AND p.item_venta = 1 AND p.habilitado = 1`;
                } else if (value === 'Congelado') {
                    baseQuery += ` AND p.congelado = 1`;
                } else if (value === 'Deshabilitado') {
                    baseQuery += ` AND p.habilitado = 0`;
                } else if (value === 'No disponible para venta') {
                    baseQuery += ` AND p.item_venta = 0`;
                }
            } else if (key === 'disponible_para_venta') {
                // Manejo especial para disponibilidad
                if (value === true || value === 1 || value === 'true') {
                    baseQuery += ` AND v.producto_id IS NULL AND p.congelado = 0 AND p.item_venta = 1 AND p.habilitado = 1`;
                } else {
                    baseQuery += ` AND (v.producto_id IS NOT NULL OR p.congelado = 1 OR p.item_venta = 0 OR p.habilitado = 0)`;
                }
            } else if (fieldConfig.operator === 'LIKE') {
                baseQuery += ` AND ${fieldConfig.column} ${fieldConfig.operator} ?`;
                queryParams.push(`%${value}%`);
            } else {
                baseQuery += ` AND ${fieldConfig.column} ${fieldConfig.operator} ?`;
                queryParams.push(value);
            }
        } else {
            console.warn(`ADVERTENCIA: Campo de búsqueda no válido '${key}' ha sido ignorado.`);
        }
    }

    baseQuery += ` ORDER BY p.id DESC`;
    
    // Agregar límite si se especifica - CORREGIR VALIDACIÓN
    if (maxResults && Number(maxResults) > 0) {
        baseQuery += ' LIMIT ?';
        queryParams.push(Number(maxResults));
        console.log(`Aplicando límite de ${maxResults} resultados`);
    }
    
    console.log(`Consulta SQL a ejecutar: ${baseQuery}`);
    console.log(`Parámetros: [${queryParams.join(', ')}]`);

    try {
        const [rows] = await db.execute(baseQuery, queryParams);

        if (rows.length === 0) {
            return res.status(404).json({
                status: 'fail',
                message: 'No se encontraron productos con los criterios de búsqueda proporcionados.'
            });
        }

        // Agregar resumen a cada producto
        const resultados = rows.map(producto => ({
            ...producto,
            resumen: {
                producto_id: producto.id,
                nombre: producto.nombre,
                estado: producto.estado_venta,
                disponible: producto.disponible_para_venta,
                vendido: producto.venta_id ? true : false,
                fecha_venta: producto.fecha_venta || null
            }
        }));
        
        res.status(200).json({
            status: 'success',
            count: rows.length,
            data: resultados,
            message: 'Estado de venta de productos encontrados',
            limited: maxResults ? true : false,
            max_results_applied: maxResults || null
        });
    } catch (error) {
        console.error(`!!! ERROR EN EL CONTROLADOR [getEstadoVentaProducto]:`, error.message);
        res.status(500).json({
            status: 'error',
            message: 'Error interno del servidor al verificar estado de productos.'
        });
    }
};

/**
 * @description Obtiene estadísticas de productos por estado de venta.
 * @param {import('express').Request} req Objeto de solicitud de Express.
 * @param {import('express').Response} res Objeto de respuesta de Express.
 */
export const getEstadisticasVentas = async (req, res) => {
    console.log("-> Solicitud GET en /api/productos/estadisticas-ventas.");
    
    try {
        const query = `
            SELECT 
                COUNT(*) as total_productos,
                COUNT(v.producto_id) as productos_vendidos,
                COUNT(*) - COUNT(v.producto_id) as productos_disponibles,
                SUM(CASE WHEN p.congelado = 1 THEN 1 ELSE 0 END) as productos_congelados,
                SUM(CASE WHEN p.habilitado = 0 THEN 1 ELSE 0 END) as productos_deshabilitados,
                SUM(CASE WHEN p.item_venta = 0 THEN 1 ELSE 0 END) as productos_no_venta,
                ROUND(COUNT(v.producto_id) * 100.0 / COUNT(*), 2) as porcentaje_vendidos
            FROM producto p 
            LEFT JOIN ventas v ON p.id = v.producto_id
        `;
        
        const [rows] = await db.execute(query);
        const stats = rows[0];
        
        res.status(200).json({
            status: 'success',
            data: {
                total_productos: stats.total_productos,
                productos_vendidos: stats.productos_vendidos,
                productos_disponibles: stats.productos_disponibles,
                productos_congelados: stats.productos_congelados,
                productos_deshabilitados: stats.productos_deshabilitados,
                productos_no_venta: stats.productos_no_venta,
                porcentaje_vendidos: `${stats.porcentaje_vendidos}%`
            },
            message: 'Estadísticas generales de estado de productos'
        });
    } catch (error) {
        console.error("!!! ERROR EN EL CONTROLADOR [getEstadisticasVentas]:", error.message);
        res.status(500).json({
            status: 'error',
            message: 'Error interno del servidor al obtener estadísticas.'
        });
    }
};