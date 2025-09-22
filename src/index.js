// index.js - Archivo principal reorganizado
import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import './db.js';

// Importar todas las rutas
import ventasRoutes from './routes/ventas.routes.js';
import productosRoutes from './routes/productos.routes.js';
import systemRoutes from './routes/system.routes.js';

const app = express();


/**
 * Middleware para limpiar y parsear JSON con manejo de errores mejorado
 */
const cleanAndParseJSON = (req, res, next) => {
    // Solo procesar métodos que esperan JSON
    if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
        return next();
    }

    // Verificar Content-Type
    if (req.headers['content-type'] !== 'application/json') {
        return res.status(415).json({ 
            status: 'error',
            message: 'Content-Type no soportado. Se esperaba application/json.' 
        });
    }

    let rawData = '';
    
    req.on('data', chunk => {
        rawData += chunk;
    });

    req.on('end', () => {
        // Manejar cuerpo vacío
        if (!rawData.trim()) {
            req.body = {}; 
            return next();
        }

        try {
            console.log('📥 JSON recibido:', rawData);
            
            // Limpiar JSON común mal formateado
            let cleanedData = rawData
                .replace(/:\s*,/g, ': null,')        // : , -> : null,
                .replace(/:\s*}/g, ': null}')        // : } -> : null}
                .replace(/,(\s*[}\]])/g, '$1')       // , } -> }
                .replace(/,(\s*,)/g, ',')            // ,, -> ,
                .trim();

            // Log solo si hubo cambios en la limpieza
            if (cleanedData !== rawData) {
                console.log('JSON después de limpiar:', cleanedData);
            }
            
            // Parsear JSON limpiado
            req.body = JSON.parse(cleanedData);
            console.log('JSON parseado exitosamente');
            
            next();
        } catch (error) {
            console.error(' Error parseando JSON:', error.message);
            
            // Respuesta de error más informativa
            res.status(400).json({ 
                status: 'error', 
                message: 'JSON malformado. Verifique la sintaxis.',
                error_details: error.message,
                received_data: rawData.length > 500 ? 
                    rawData.substring(0, 500) + '...' : rawData
            });
        }
    });

    // Manejar errores de conexión
    req.on('error', (error) => {
        console.error('Error en la solicitud:', error);
        res.status(400).json({
            status: 'error',
            message: 'Error procesando la solicitud'
        });
    });
};

/**
 * Middleware de logging mejorado
 */
const requestLogger = (req, res, next) => {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.originalUrl;
    const ip = req.ip || req.connection.remoteAddress;
    
    console.log(`\n [${timestamp}] ${method} ${url} - IP: ${ip}`);
    
    // Log del body para POST/PUT/PATCH (solo primeros caracteres)
    if (['POST', 'PUT', 'PATCH'].includes(method) && req.body) {
        const bodyStr = JSON.stringify(req.body);
        const truncatedBody = bodyStr.length > 200 ? 
            bodyStr.substring(0, 200) + '...' : bodyStr;
        console.log(` Body: ${truncatedBody}`);
    }
    
    next();
};

/**
 * Middleware de autenticación (opcional)
 */
const authenticate = (req, res, next) => {
    // Solo aplicar autenticación si está configurada la clave maestra
    if (process.env.MASTER_API_KEY) {
        const authHeader = req.headers.authorization;
        const providedKey = authHeader?.replace('Bearer ', '');
        
        if (providedKey !== process.env.MASTER_API_KEY) {
            return res.status(401).json({
                status: 'error',
                message: 'Token de autorización inválido'
            });
        }
    }
    next();
};

/**
 * Middleware de manejo de errores global
 */
const errorHandler = (err, req, res, next) => {
    console.error('Error no capturado:', err);
    
    // Error de validación JSON
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            status: 'error',
            message: 'JSON inválido en el cuerpo de la solicitud'
        });
    }
    
    // Error de base de datos
    if (err.code && err.code.startsWith('ER_')) {
        return res.status(500).json({
            status: 'error',
            message: 'Error de base de datos',
            code: err.code
        });
    }
    
    // Error genérico
    res.status(500).json({
        status: 'error',
        message: 'Error interno del servidor',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};


// Logging de inicio
console.log('\nIniciando servidor...');
console.log(`Clave maestra: ${process.env.MASTER_API_KEY ? 'Configurada' : 'No configurada'}`);
console.log(`Base de datos: ${process.env.DB_HOST || 'localhost'}`);
console.log(`Entorno: ${process.env.NODE_ENV || 'development'}\n`);

// Middlewares globales
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(requestLogger);
app.use(cleanAndParseJSON);

// Autenticación (comentar si no se necesita)
// app.use(authenticate);


// Ruta de salud/estado
app.get('/api/health', (req, res) => {
    res.json({
        status: 'success',
        message: 'Servidor funcionando correctamente',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0'
    });
});

// Rutas principales
app.use('/api/ventas', ventasRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/system', systemRoutes);

// Ruta legacy (mantener compatibilidad)
app.use('/api', ventasRoutes);


// Middleware para rutas no encontradas
app.use('*', (req, res) => {
    console.log(`Ruta no encontrada: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        status: 'fail',
        message: `Endpoint no encontrado: ${req.method} ${req.originalUrl}`,
        available_endpoints: [
            'GET /api/health',
            'GET /api/system/tables', 
            'POST /api/system/table-structure',
            'POST /api/productos/search',
            'POST /api/productos/disponibles',
            'POST /api/productos/vendidos',
            'POST /api/ventas/search'
        ]
    });
});

// Middleware de manejo de errores
app.use(errorHandler);


const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
    console.log(`\n Servidor iniciado exitosamente`);
    console.log(` Dirección: http://${HOST}:${PORT}`);
    console.log(` Endpoints disponibles:`);
    console.log(`   • GET  /api/health`);
    console.log(`   • GET  /api/tables`);
    console.log(`   • POST /api/table-structure`);
    console.log(`   • POST /api/productos/search`);
    console.log(`   • POST /api/productos/disponibles`);
    console.log(`   • POST /api/productos/vendidos`);
    console.log(`   • POST /api/ventas/search`);
    console.log(`\n API lista para recibir solicitudes\n`);
});

// Manejo graceful de cierre
process.on('SIGTERM', () => {
    console.log('\n Recibida señal SIGTERM, cerrando servidor...');
    server.close(() => {
        console.log(' Servidor cerrado correctamente');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('\n Recibida señal SIGINT (Ctrl+C), cerrando servidor...');
    server.close(() => {
        console.log(' Servidor cerrado correctamente');
        process.exit(0);
    });
});

// Manejo de errores no capturados
process.on('unhandledRejection', (reason, promise) => {
    console.error(' Promesa rechazada no manejada:', reason);
    // No cerrar el servidor automáticamente, solo loggear
});

process.on('uncaughtException', (error) => {
    console.error(' Excepción no capturada:', error);
    console.log('Cerrando servidor por excepción crítica...');
    server.close(() => {
        process.exit(1);
    });
});

export default app;