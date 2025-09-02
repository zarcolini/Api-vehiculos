import express from 'express';
import { 
  searchProductos
} from '../controllers/productos.controller.js';

const router = express.Router();

router.post('/search', searchProductos);

export default router;