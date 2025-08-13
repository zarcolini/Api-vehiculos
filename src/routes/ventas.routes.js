// src/routes/ventas.routes.js
import { Router } from 'express';
import { 
    getVentas, 
    getVentaById, 
    createVenta, 
    searchVentas, 
    getTables, 
    getTableStructure,
    getProductos,
    getProductoById,
    searchProductos
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

// GET para obtener todas las tablas de la base de datos
router.get('/tables', getTables);

// GET para obtener la estructura de una tabla específica
router.get('/table-structure/:tableName', getTableStructure);

// --- Rutas de Ventas ---

// GET para obtener todas las ventas
router.get('/ventas', getVentas);

// GET para obtener una venta por ID en la URL
router.get('/ventas/:id', getVentaById);

// POST para simular la creación de una venta
router.post('/ventas', createVenta);

// POST para realizar una búsqueda dinámica en ventas
router.post('/ventas/search', searchVentas);

// --- Rutas de Productos ---

// GET para obtener todos los productos
router.get('/productos', getProductos);

// GET para obtener un producto por ID
router.get('/productos/:id', getProductoById);

// POST para realizar una búsqueda dinámica en productos
router.post('/productos/search', searchProductos);

export default router;