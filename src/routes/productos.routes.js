import express from 'express';
import { 
  searchProductos, 
  getProductosDisponibles,
  getProductosVendidos,
  getEstadoVentaProducto 
} from '../controllers/productos.controller.js';

const router = express.Router();

router.post('/search', searchProductos);
router.post('/disponibles', getProductosDisponibles);
router.post('/vendidos', getProductosVendidos);
router.post('/estado-venta', getEstadoVentaProducto);

export default router;