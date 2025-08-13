import { db } from '../db.js';

// =====================================================
// UTILIDADES
// =====================================================

/**
 * Convierte un valor a número entero de forma segura
 * @param {any} value - Valor a convertir
 * @param {number|null} defaultValue - Valor por defecto si la conversión falla
 * @returns {number|null}
 */
const toSafeInteger = (value, defaultValue = null) => {
    if (value === null || value === undefined) return defaultValue;
    const num = Number(value);
    return Number.isInteger(num) && num >= 0 ? num : defaultValue; // Permitir 0
};

/**
 * Convierte un valor a número decimal de forma segura
 * @param {any} value - Valor a convertir
 * @param {number|null} defaultValue - Valor por defecto si la conversión falla
 * @returns {number|null}
 */
const toSafeDecimal = (value, defaultValue = null) => {
    if (value === null || value === undefined) return defaultValue;
    const num = Number(value);
    return !isNaN(num) && isFinite(num) ? num : defaultValue;
};

/**
 * Convierte un valor booleano de forma segura
 * @param {any} value - Valor a convertir
 * @returns {number} 1 o 0 para MariaDB
 */
const toSafeBoolean = (value) => {
    if (value === true || value === 1 || value === '1' || String(value).toLowerCase() === 'true') return 1;
    if (value === false || value === 0 || value === '0' || String(value).toLowerCase() === 'false') return 0;
    return 0;
};

/**
 * Sanitiza un string para búsquedas LIKE
 * @param {string} value - Valor a sanitizar
 * @returns {string}
 */
const sanitizeForLike = (value) => {
    if (typeof value !== 'string' || !value) return '%';
    // Escapar caracteres especiales de SQL LIKE: %, _, \
    return `%${value.replace(/[%_\\]/g, '\\$&')}%`;
};

/**
 * Valida si un nombre de tabla es seguro
 * @param {string} tableName - Nombre de la tabla
 * @returns {boolean}
 */
const isValidTableName = (tableName) => {
    const tableNameRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    return typeof tableName === 'string' && tableNameRegex.test(tableName);
};


// =====================================================
// ENDPOINTS DE VENTAS
// =====================================================

/**
 * @description Busca ventas dinámicamente según los criterios proporcionados
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 */
export const searchVentas = async (req, res) => {
    const searchParams = { ...req.body };
    console.log(`-> POST /api/ventas/search:`, searchParams);

    // Extraer y validar max_results
    const maxResults = toSafeInteger(searchParams.max_results);
    delete searchParams.max_results;

    // Si no hay parámetros, devolver todas las ventas
    if (Object.keys(searchParams).length === 0) {
        console.log("Sin filtros, devolviendo todas las ventas...");
        try {
            let query = 'SELECT * FROM ventas ORDER BY id DESC';
            const queryParams = [];
            
            if (maxResults) {
                query += ' LIMIT ?';
                queryParams.push(maxResults);
            }
            
            const [rows] = await db.execute(query, queryParams);
            return res.status(200).json({
                status: 'success',
                count: rows.length,
                data: rows,
                message: 'Todas las ventas (sin filtros)',
                limited: !!maxResults,
                max_results_applied: maxResults
            });
        } catch (error) {
            console.error("ERROR al obtener ventas:", error);
            return res.status(500).json({
                status: 'error',
                message: 'Error interno del servidor'
            });
        }
    }

    // Configuración de campos válidos
    const validFields = {
        id: { column: 'id', operator: '=', type: 'integer' },
        ids: { column: 'id', operator: 'IN', type: 'array' },
        precio: { column: 'precio_venta', operator: '=', type: 'decimal' },
        precio_minimo: { column: 'precio_venta', operator: '>=', type: 'decimal' },
        precio_maximo: { column: 'precio_venta', operator: '<=', type: 'decimal' },
        trasmision: { column: 'trasmision', operator: '=', type: 'string' },
        id_estado: { column: 'id_estado', operator: '=', type: 'integer' },
        fecha_venta: { column: 'fecha_venta', operator: '=', type: 'date' },
        fecha_desde: { column: 'fecha_venta', operator: '>=', type: 'date' },
        fecha_hasta: { column: 'fecha_venta', operator: '<=', type: 'date' },
        producto_id: { column: 'producto_id', operator: '=', type: 'integer' }
    };

    let baseQuery = 'SELECT * FROM ventas WHERE 1=1';
    const queryParams = [];

    // Construir consulta dinámicamente con validación de tipos
    for (const [key, value] of Object.entries(searchParams)) {
        const field = validFields[key];
        if (!field) {
            console.warn(`Campo no válido ignorado: ${key}`);
            continue;
        }

        // Validación y conversión según tipo
        let processedValue = value;
        
        if (field.type === 'integer') {
            processedValue = toSafeInteger(value);
            if (processedValue === null) {
                console.warn(`Valor inválido para campo entero ${key}: ${value}`);
                continue;
            }
        } else if (field.type === 'decimal') {
            processedValue = toSafeDecimal(value);
            if (processedValue === null) {
                console.warn(`Valor inválido para campo decimal ${key}: ${value}`);
                continue;
            }
        } else if (field.type === 'array' && key === 'ids') {
            if (!Array.isArray(value) || value.length === 0) {
                console.warn(`Array inválido para ${key}`);
                continue;
            }
            const validIds = value.map(id => toSafeInteger(id)).filter(id => id !== null);
            if (validIds.length === 0) continue;
            
            const placeholders = validIds.map(() => '?').join(',');
            baseQuery += ` AND ${field.column} IN (${placeholders})`;
            queryParams.push(...validIds);
            continue;
        }

        baseQuery += ` AND ${field.column} ${field.operator} ?`;
        queryParams.push(processedValue);
    }
    
    baseQuery += ' ORDER BY id DESC';
    
    if (maxResults) {
        baseQuery += ' LIMIT ?';
        queryParams.push(maxResults);
    }
    
    console.log(`SQL: ${baseQuery}`);
    console.log(`Params: [${queryParams.map(p => `${p}(${typeof p})`).join(', ')}]`);

    try {
        const [rows] = await db.execute(baseQuery, queryParams);

        if (rows.length === 0) {
            return res.status(404).json({
                status: 'fail',
                message: 'No se encontraron ventas con los criterios especificados'
            });
        }
        
        res.status(200).json({
            status: 'success',
            count: rows.length,
            data: rows,
            limited: !!maxResults,
            max_results_applied: maxResults
        });
    } catch (error) {
        console.error(`ERROR en searchVentas:`, error);
        res.status(500).json({
            status: 'error',
            message: 'Error al buscar ventas',
            detail: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// =====================================================
// ENDPOINTS DE TABLAS
// =====================================================

/**
 * @description Obtiene lista de tablas en la base de datos
 */
export const getTables = async (req, res) => {
    console.log("-> GET /api/tables");
    
    try {
        const [rows] = await db.execute('SHOW TABLES');
        const tableNames = rows.map(row => Object.values(row)[0]);
        
        console.log(`Tablas encontradas: ${tableNames.length}`);
        
        res.status(200).json({
            status: 'success',
            count: tableNames.length,
            data: {
                tables: tableNames,
                details: rows
            }
        });
    } catch (error) {
        console.error("ERROR en getTables:", error);
        res.status(500).json({
            status: 'error',
            message: 'Error al obtener tablas'
        });
    }
};

/**
 * @description Obtiene estructura de una tabla específica
 */
export const getTableStructure = async (req, res) => {
    const { tableName } = req.body;
    console.log(`-> POST /api/table-structure: ${tableName}`);
    
    if (!tableName || !isValidTableName(tableName)) {
        return res.status(400).json({
            status: 'fail',
            message: 'Nombre de tabla inválido o no proporcionado'
        });
    }
    
    try {
        // DESCRIBE es seguro después de validar el nombre
        const [rows] = await db.execute(`DESCRIBE \`${tableName}\``);
        
        if (rows.length === 0) {
            return res.status(404).json({
                status: 'fail',
                message: `La tabla '${tableName}' no existe o no tiene columnas.`
            });
        }
        
        const tableInfo = rows.map(row => ({
            field: row.Field,
            type: row.Type,
            null: row.Null === 'YES',
            key: row.Key,
            default: row.Default,
            extra: row.Extra
        }));
        
        res.status(200).json({
            status: 'success',
            tableName,
            fieldsCount: rows.length,
            data: {
                structure: tableInfo,
                rawData: rows
            }
        });
    } catch (error) {
        console.error(`ERROR en getTableStructure:`, error);
        
        if (error.code === 'ER_NO_SUCH_TABLE') {
            return res.status(404).json({
                status: 'fail',
                message: `La tabla '${tableName}' no existe`
            });
        }
        
        res.status(500).json({
            status: 'error',
            message: 'Error al obtener estructura de tabla'
        });
    }
};

// =====================================================
// ENDPOINTS DE PRODUCTOS
// =====================================================

/**
 * @description Busca productos dinámicamente con filtros
 */
export const searchProductos = async (req, res) => {
    const searchParams = { ...req.body };
    console.log(`-> POST /api/productos/search:`, searchParams);

    // Extraer y validar max_results
    const maxResults = toSafeInteger(searchParams.max_results);
    delete searchParams.max_results;

    // Si no hay parámetros, devolver todos
    if (Object.keys(searchParams).length === 0) {
        console.log("Sin filtros, devolviendo todos los productos...");
        try {
            let query = 'SELECT * FROM producto ORDER BY id DESC';
            const queryParams = [];
            
            if (maxResults) {
                query += ' LIMIT ?';
                queryParams.push(maxResults);
            }
            
            const [rows] = await db.execute(query, queryParams);
            return res.status(200).json({
                status: 'success',
                count: rows.length,
                data: rows,
                message: 'Todos los productos (sin filtros)',
                limited: !!maxResults,
                max_results_applied: maxResults
            });
        } catch (error) {
            console.error("ERROR al obtener productos:", error);
            return res.status(500).json({
                status: 'error',
                message: 'Error interno del servidor'
            });
        }
    }

    // Configuración de campos con tipos específicos
    const validFields = {
        // Identificación
        id: { column: 'id', operator: '=', type: 'integer' },
        ids: { column: 'id', operator: 'IN', type: 'array' },
        codigo_alterno: { column: 'codigo_alterno', operator: 'LIKE', type: 'string' },
        nombre: { column: 'nombre', operator: 'LIKE', type: 'string' },
        
        // Vehículo
        marca: { column: 'marca', operator: 'LIKE', type: 'string' },
        anio: { column: 'anio', operator: '=', type: 'integer' },
        anio_desde: { column: 'anio', operator: '>=', type: 'integer' },
        anio_hasta: { column: 'anio', operator: '<=', type: 'integer' },
        modelo: { column: 'modelo', operator: 'LIKE', type: 'string' },
        color: { column: 'color', operator: 'LIKE', type: 'string' },
        cilindrada: { column: 'cilindrada', operator: 'LIKE', type: 'string' },
        tipo_vehiculo: { column: 'tipo_vehiculo', operator: 'LIKE', type: 'string' },
        
        // Identificadores
        serie: { column: 'serie', operator: 'LIKE', type: 'string' },
        motor: { column: 'motor', operator: 'LIKE', type: 'string' },
        placa: { column: 'placa', operator: 'LIKE', type: 'string' },
        chasis: { column: 'chasis', operator: 'LIKE', type: 'string' },
        
        // Precios
        precio_costo: { column: 'precio_costo', operator: '=', type: 'decimal' },
        precio_costo_minimo: { column: 'precio_costo', operator: '>=', type: 'decimal' },
        precio_costo_maximo: { column: 'precio_costo', operator: '<=', type: 'decimal' },
        precio_venta: { column: 'precio_venta', operator: '=', type: 'decimal' },
        precio_venta_minimo: { column: 'precio_venta', operator: '>=', type: 'decimal' },
        precio_venta_maximo: { column: 'precio_venta', operator: '<=', type: 'decimal' },
        
        // Kilometraje
        km: { column: 'km', operator: '=', type: 'integer' },
        km_minimo: { column: 'km', operator: '>=', type: 'integer' },
        km_maximo: { column: 'km', operator: '<=', type: 'integer' },
        horas: { column: 'horas', operator: '=', type: 'integer' },
        horas_minimo: { column: 'horas', operator: '>=', type: 'integer' },
        horas_maximo: { column: 'horas', operator: '<=', type: 'integer' },
        
        // Estados (booleanos en MariaDB: TINYINT)
        habilitado: { column: 'habilitado', operator: '=', type: 'boolean' },
        congelado: { column: 'congelado', operator: '=', type: 'boolean' },
        item_venta: { column: 'item_venta', operator: '=', type: 'boolean' },
        item_compra: { column: 'item_compra', operator: '=', type: 'boolean' },
        item_inventario: { column: 'item_inventario', operator: '=', type: 'boolean' },
        
        // Otros
        tipo: { column: 'tipo', operator: '=', type: 'string' },
        tipo_mant: { column: 'tipo_mant', operator: '=', type: 'string' },
        codigo_grupo: { column: 'codigo_grupo', operator: 'LIKE', type: 'string' },
        clase: { column: 'clase', operator: 'LIKE', type: 'string' }
    };

    let baseQuery = 'SELECT * FROM producto WHERE 1=1';
    const queryParams = [];

    // Construir consulta con validación de tipos
    for (const [key, value] of Object.entries(searchParams)) {
        const field = validFields[key];
        if (!field) {
            console.warn(`Campo no válido ignorado: ${key}`);
            continue;
        }

        // Procesar según tipo
        let processedValue = value;
        
        if (field.type === 'integer') {
            processedValue = toSafeInteger(value);
            if (processedValue === null) {
                console.warn(`Valor entero inválido para ${key}: ${value}`);
                continue;
            }
        } else if (field.type === 'decimal') {
            processedValue = toSafeDecimal(value);
            if (processedValue === null) {
                console.warn(`Valor decimal inválido para ${key}: ${value}`);
                continue;
            }
        } else if (field.type === 'boolean') {
            processedValue = toSafeBoolean(value);
        } else if (field.type === 'array' && key === 'ids') {
            if (!Array.isArray(value) || value.length === 0) continue;
            
            const validIds = value.map(id => toSafeInteger(id)).filter(id => id !== null);
            if (validIds.length === 0) continue;
            
            const placeholders = validIds.map(() => '?').join(',');
            baseQuery += ` AND ${field.column} IN (${placeholders})`;
            queryParams.push(...validIds);
            continue;
        } else if (field.type === 'string' && field.operator === 'LIKE') {
            processedValue = sanitizeForLike(value);
        }

        baseQuery += ` AND ${field.column} ${field.operator} ?`;
        queryParams.push(processedValue);
    }
    
    baseQuery += ' ORDER BY id DESC';
    
    if (maxResults) {
        baseQuery += ' LIMIT ?';
        queryParams.push(maxResults);
    }
    
    console.log(`SQL: ${baseQuery}`);
    console.log(`Params: [${queryParams.map(p => `${p}(${typeof p})`).join(', ')}]`);

    try {
        const [rows] = await db.execute(baseQuery, queryParams);

        if (rows.length === 0) {
            return res.status(404).json({
                status: 'fail',
                message: 'No se encontraron productos con los criterios especificados'
            });
        }
        
        res.status(200).json({
            status: 'success',
            count: rows.length,
            data: rows,
            limited: !!maxResults,
            max_results_applied: maxResults
        });
    } catch (error) {
        console.error(`ERROR en searchProductos:`, error);
        res.status(500).json({
            status: 'error',
            message: 'Error al buscar productos',
            detail: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @description Obtiene productos disponibles para venta
 */
export const getProductosDisponibles = async (req, res) => {
    const filters = { ...req.body };
    console.log("-> POST /api/productos/disponibles:", filters);
    
    const maxResults = toSafeInteger(filters.max_results);
    delete filters.max_results;
    
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
        
        // Aplicar filtros con validación
        if (filters.marca) {
            baseQuery += ` AND p.marca LIKE ?`;
            queryParams.push(sanitizeForLike(filters.marca));
        }
        if (filters.modelo) {
            baseQuery += ` AND p.modelo LIKE ?`;
            queryParams.push(sanitizeForLike(filters.modelo));
        }
        if (filters.anio) {
            const anio = toSafeInteger(filters.anio);
            if (anio) {
                baseQuery += ` AND p.anio = ?`;
                queryParams.push(anio);
            }
        }
        if (filters.km_maximo) {
            const km = toSafeInteger(filters.km_maximo);
            if (km) {
                baseQuery += ` AND p.km <= ?`;
                queryParams.push(km);
            }
        }
        if (filters.precio_venta_maximo) {
            const precio = toSafeDecimal(filters.precio_venta_maximo);
            if (precio !== null) {
                baseQuery += ` AND p.precio_venta <= ?`;
                queryParams.push(precio);
            }
        }
        
        baseQuery += ` ORDER BY p.id DESC`;
        
        if (maxResults) {
            baseQuery += ' LIMIT ?';
            queryParams.push(maxResults);
        }
        
        const [rows] = await db.execute(baseQuery, queryParams);
        
        res.status(200).json({
            status: 'success',
            count: rows.length,
            data: rows,
            message: 'Productos disponibles para venta',
            limited: !!maxResults,
            max_results_applied: maxResults
        });
    } catch (error) {
        console.error("ERROR en getProductosDisponibles:", error);
        res.status(500).json({
            status: 'error',
            message: 'Error al obtener productos disponibles'
        });
    }
};

/**
 * @description Obtiene productos vendidos con información de venta
 */
export const getProductosVendidos = async (req, res) => {
    const filters = { ...req.body };
    console.log("-> POST /api/productos/vendidos:", filters);
    
    const maxResults = toSafeInteger(filters.max_results);
    delete filters.max_results;
    
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
        
        // Aplicar filtros
        if (filters.marca) {
            baseQuery += ` AND p.marca LIKE ?`;
            queryParams.push(sanitizeForLike(filters.marca));
        }
        if (filters.modelo) {
            baseQuery += ` AND p.modelo LIKE ?`;
            queryParams.push(sanitizeForLike(filters.modelo));
        }
        if (filters.anio) {
            const anio = toSafeInteger(filters.anio);
            if (anio) {
                baseQuery += ` AND p.anio = ?`;
                queryParams.push(anio);
            }
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
        
        if (maxResults) {
            baseQuery += ' LIMIT ?';
            queryParams.push(maxResults);
        }
        
        const [rows] = await db.execute(baseQuery, queryParams);
        
        res.status(200).json({
            status: 'success',
            count: rows.length,
            data: rows,
            message: 'Productos vendidos',
            limited: !!maxResults,
            max_results_applied: maxResults
        });
    } catch (error) {
        console.error("ERROR en getProductosVendidos:", error);
        res.status(500).json({
            status: 'error',
            message: 'Error al obtener productos vendidos'
        });
    }
};

/**
 * @description Verifica el estado de venta de productos
 */
export const getEstadoVentaProducto = async (req, res) => {
    const searchParams = { ...req.body };
    console.log(`-> POST /api/productos/estado-venta:`, searchParams);

    if (Object.keys(searchParams).length === 0) {
        return res.status(400).json({
            status: 'fail',
            message: 'Se requiere al menos un parámetro de búsqueda'
        });
    }

    const maxResults = toSafeInteger(searchParams.max_results);
    delete searchParams.max_results;

    const validFields = {
        id: { column: 'p.id', operator: '=', type: 'integer' },
        ids: { column: 'p.id', operator: 'IN', type: 'array' },
        codigo_alterno: { column: 'p.codigo_alterno', operator: 'LIKE', type: 'string' },
        nombre: { column: 'p.nombre', operator: 'LIKE', type: 'string' },
        marca: { column: 'p.marca', operator: 'LIKE', type: 'string' },
        modelo: { column: 'p.modelo', operator: 'LIKE', type: 'string' },
        placa: { column: 'p.placa', operator: 'LIKE', type: 'string' },
        serie: { column: 'p.serie', operator: 'LIKE', type: 'string' },
        estado_venta: { column: 'estado_calculado', operator: '=', type: 'special' },
        disponible_para_venta: { column: 'disponible_calculado', operator: '=', type: 'special' }
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
                   WHEN v.producto_id IS NOT NULL THEN 0
                   WHEN p.congelado = 1 OR p.item_venta = 0 OR p.habilitado = 0 THEN 0
                   ELSE 1
               END as disponible_para_venta
        FROM producto p
        LEFT JOIN ventas v ON p.id = v.producto_id
        WHERE 1=1
    `;
    
    const queryParams = [];

    for (const [key, value] of Object.entries(searchParams)) {
        const field = validFields[key];
        if (!field) {
            console.warn(`Campo no válido ignorado: ${key}`);
            continue;
        }

        if (field.type === 'integer') {
            const intValue = toSafeInteger(value);
            if (intValue === null) continue;
            baseQuery += ` AND ${field.column} ${field.operator} ?`;
            queryParams.push(intValue);
        } else if (field.type === 'array' && key === 'ids') {
            if (!Array.isArray(value)) continue;
            const validIds = value.map(id => toSafeInteger(id)).filter(id => id !== null);
            if (validIds.length === 0) continue;
            const placeholders = validIds.map(() => '?').join(',');
            baseQuery += ` AND ${field.column} IN (${placeholders})`;
            queryParams.push(...validIds);
        } else if (field.type === 'string' && field.operator === 'LIKE') {
            baseQuery += ` AND ${field.column} ${field.operator} ?`;
            queryParams.push(sanitizeForLike(value));
        } else if (field.type === 'special') {
            if (key === 'estado_venta') {
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
                const boolValue = toSafeBoolean(value);
                if (boolValue === 1) {
                    baseQuery += ` AND v.producto_id IS NULL AND p.congelado = 0 AND p.item_venta = 1 AND p.habilitado = 1`;
                } else {
                    baseQuery += ` AND (v.producto_id IS NOT NULL OR p.congelado = 1 OR p.item_venta = 0 OR p.habilitado = 0)`;
                }
            }
        }
    }

    baseQuery += ` ORDER BY p.id DESC`;
    
    if (maxResults) {
        baseQuery += ' LIMIT ?';
        queryParams.push(maxResults);
    }
    
    console.log(`SQL: ${baseQuery}`);
    console.log(`Params: [${queryParams.join(', ')}]`);

    try {
        const [rows] = await db.execute(baseQuery, queryParams);

        if (rows.length === 0) {
            return res.status(404).json({
                status: 'fail',
                message: 'No se encontraron productos con los criterios especificados'
            });
        }

        res.status(200).json({
            status: 'success',
            count: rows.length,
            data: rows,
            limited: !!maxResults,
            max_results_applied: maxResults
        });
    } catch (error) {
        console.error(`ERROR en getEstadoVentaProducto:`, error);
        res.status(500).json({
            status: 'error',
            message: 'Error al verificar estado de productos'
        });
    }
};

/**
 * @description Obtiene estadísticas de productos por estado de venta.
 */
export const getEstadisticasVentas = async (req, res) => {
    console.log("-> GET /api/productos/estadisticas-ventas");
    
    try {
        const query = `
            SELECT 
                COUNT(*) as total_productos,
                SUM(CASE WHEN v.producto_id IS NOT NULL THEN 1 ELSE 0 END) as productos_vendidos,
                SUM(CASE WHEN v.producto_id IS NULL AND p.habilitado = 1 AND p.congelado = 0 AND p.item_venta = 1 THEN 1 ELSE 0 END) as productos_disponibles,
                SUM(CASE WHEN p.congelado = 1 THEN 1 ELSE 0 END) as productos_congelados,
                SUM(CASE WHEN p.habilitado = 0 THEN 1 ELSE 0 END) as productos_deshabilitados,
                SUM(CASE WHEN p.item_venta = 0 THEN 1 ELSE 0 END) as productos_no_para_venta
            FROM producto p 
            LEFT JOIN ventas v ON p.id = v.producto_id
        `;
        
        const [rows] = await db.execute(query);
        const stats = rows[0];
        const total = parseInt(stats.total_productos, 10);
        const vendidos = parseInt(stats.productos_vendidos, 10);
        
        res.status(200).json({
            status: 'success',
            data: {
                total_productos: total,
                productos_vendidos: vendidos,
                productos_disponibles: parseInt(stats.productos_disponibles, 10),
                productos_congelados: parseInt(stats.productos_congelados, 10),
                productos_deshabilitados: parseInt(stats.productos_deshabilitados, 10),
                productos_no_para_venta: parseInt(stats.productos_no_para_venta, 10),
                porcentaje_vendidos: total > 0 ? parseFloat(((vendidos / total) * 100).toFixed(2)) : 0
            },
            message: 'Estadísticas generales del estado de los productos'
        });
    } catch (error) {
        console.error("ERROR en getEstadisticasVentas:", error);
        res.status(500).json({
            status: 'error',
            message: 'Error interno del servidor al obtener estadísticas.'
        });
    }
};