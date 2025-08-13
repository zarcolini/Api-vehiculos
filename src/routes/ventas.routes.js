// src/routes/ventas.routes.js
import { Router } from 'express';
import { getVentas, getVentaById, createVenta, searchVentas } from '../controllers/ventas.controller.js';

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

// Aplicamos el middleware de seguridad a todas las rutas de ventas
router.use(bearerTokenAuth);

// --- Rutas ---

// GET para obtener todas las ventas
router.get('/ventas', getVentas);

// GET para obtener una venta por ID en la URL
router.get('/ventas/:id', getVentaById);

// POST para simular la creación de una venta
router.post('/ventas', createVenta);

// POST para realizar una búsqueda dinámica en el cuerpo de la solicitud
router.post('/ventas/search', searchVentas);

export default router;