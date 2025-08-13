// src/routes/ventas.routes.js
import { Router } from 'express';
import { 
    searchVentas, 
    getTables, 
    getTableStructure,
    searchProductos,
    getProductosDisponibles,
    getProductosVendidos,
    getEstadoVentaProducto,
    getEstadisticasVentas
} from '../controllers/ventas.controller.js';

const router = Router();

// Middleware de Autenticación por Bearer Token
const bearerTokenAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
        return res.status(401).json({ message: 'Acceso no autorizado: Falta la cabecera de autorización.' });
    }

    const token = authHeader.split(' ')[1];

    if (!token || token !== process.env.MASTER_API_KEY) {
        return res.status(401).json({ message: 'Acceso no autorizado: Token inválido o no proporcionado.' });
    }
    
    next();
};

// Aplicamos el middleware de seguridad a todas las rutas
router.use(bearerTokenAuth);

// --- Rutas de Sistema ---

// GET para obtener todas las tablas de la base de datos (mantiene GET)
router.get('/tables', getTables);

// POST para obtener la estructura de una tabla específica (cambiado a JSON body)
router.post('/table-structure', getTableStructure);

// --- Rutas de Ventas ---

// POST para realizar búsqueda de ventas con JSON (incluye obtener todas si no hay filtros)
router.post('/ventas/search', searchVentas);

// --- Rutas de Productos ---

// GET para obtener estadísticas de ventas (mantiene GET)
router.get('/productos/estadisticas-ventas', getEstadisticasVentas);

// POST para obtener productos disponibles con filtros opcionales
router.post('/productos/disponibles', getProductosDisponibles);

// POST para obtener productos vendidos con filtros opcionales
router.post('/productos/vendidos', getProductosVendidos);

// POST para verificar estado de venta con JSON
router.post('/productos/estado-venta', getEstadoVentaProducto);

// POST para realizar búsqueda de productos (incluye obtener todos si no hay filtros)
router.post('/productos/search', searchProductos);

export default router;