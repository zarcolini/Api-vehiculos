import { Router } from 'express';
import { searchVentas } from '../controllers/ventas.controller.js';

const router = Router();

// Middleware de Autenticación por Bearer Token
const bearerTokenAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
        return res.status(401).json({ 
            status: 'error',
            message: 'Acceso no autorizado: Falta la cabecera de autorización.' 
        });
    }

    const token = authHeader.split(' ')[1];

    if (!token || token !== process.env.MASTER_API_KEY) {
        return res.status(401).json({ 
            status: 'error',
            message: 'Acceso no autorizado: Token inválido o no proporcionado.' 
        });
    }
    
    next();
};

// Aplicar middleware de autenticación a todas las rutas
router.use(bearerTokenAuth);

// SOLO ruta de búsqueda de ventas
router.post('/search', searchVentas);

export default router;