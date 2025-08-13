// api/ventas.js - Archivo principal para todas las rutas de ventas
import mysql from 'mysql2/promise';

// Configuración de la base de datos
const dbSettings = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: parseInt(process.env.DB_PORT || '3306', 10),
    connectionLimit: 1,
    queueLimit: 0,
    acquireTimeout: 10000,
    waitForConnections: true,
    ssl: false,
    charset: 'utf8mb4'
};

let pool;

async function getConnection() {
    if (!pool) {
        pool = mysql.createPool(dbSettings);
    }
    return pool;
}

async function query(sql, params = []) {
    try {
        const connection = await getConnection();
        const [rows] = await connection.execute(sql, params);
        return rows;
    } catch (error) {
        console.error('Error en consulta:', error.message);
        throw error;
    }
}

// Controladores
const getVentas = async () => {
    const rows = await query('SELECT * FROM ventas');
    return { status: 'success', count: rows.length, data: rows };
};

const getVentaById = async (id) => {
    if (isNaN(id)) {
        throw new Error('ID no válido');
    }
    const rows = await query('SELECT * FROM ventas WHERE id = ?', [id]);
    if (rows.length === 0) {
        throw new Error('Venta no encontrada');
    }
    return { status: 'success', data: rows[0] };
};

const searchVentas = async (searchParams) => {
    if (!searchParams || Object.keys(searchParams).length === 0) {
        throw new Error('Se requiere al menos un parámetro de búsqueda');
    }

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

    for (const key in searchParams) {
        if (validFields[key]) {
            const fieldConfig = validFields[key];
            baseQuery += ` AND ${fieldConfig.column} ${fieldConfig.operator} ?`;
            queryParams.push(searchParams[key]);
        }
    }

    const rows = await query(baseQuery, queryParams);
    if (rows.length === 0) {
        throw new Error('No se encontraron ventas con los criterios proporcionados');
    }
    
    return { status: 'success', count: rows.length, data: rows };
};

// Handler principal para Vercel
export default async function handler(req, res) {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { url, method } = req;
        console.log(`${method} ${url}`);

        // GET /api/ventas
        if (method === 'GET' && url === '/api/ventas') {
            const result = await getVentas();
            return res.status(200).json(result);
        }

        // GET /api/ventas/:id
        if (method === 'GET' && url.startsWith('/api/ventas/')) {
            const id = url.split('/').pop();
            try {
                const result = await getVentaById(id);
                return res.status(200).json(result);
            } catch (error) {
                if (error.message === 'ID no válido') {
                    return res.status(400).json({ status: 'fail', message: error.message });
                }
                if (error.message === 'Venta no encontrada') {
                    return res.status(404).json({ status: 'fail', message: error.message });
                }
                throw error;
            }
        }

        // POST /api/ventas/search
        if (method === 'POST' && url === '/api/ventas/search') {
            try {
                const result = await searchVentas(req.body);
                return res.status(200).json(result);
            } catch (error) {
                if (error.message.includes('parámetro de búsqueda') || 
                    error.message.includes('No se encontraron ventas')) {
                    return res.status(404).json({ status: 'fail', message: error.message });
                }
                throw error;
            }
        }

        // POST /api/ventas (crear)
        if (method === 'POST' && url === '/api/ventas') {
            if (!req.body || Object.keys(req.body).length === 0) {
                return res.status(400).json({ 
                    status: 'fail', 
                    message: 'El cuerpo de la solicitud no puede estar vacío.' 
                });
            }
            return res.status(201).json({ 
                status: 'success', 
                message: 'Endpoint POST funciona. Datos recibidos correctamente.', 
                dataReceived: req.body 
            });
        }

        // Ruta no encontrada
        return res.status(404).json({ message: 'Endpoint no encontrado' });

    } catch (error) {
        console.error('Error interno:', error.message);
        return res.status(500).json({ 
            status: 'error', 
            message: 'Error interno del servidor' 
        });
    }
}