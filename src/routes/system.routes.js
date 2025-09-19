import express from 'express';
// 1. Importa el nuevo controlador junto con los existentes
import { getTables, getTableStructure, downloadCsvVehiculos } from '../controllers/system.controller.js';

const router = express.Router();

// Rutas existentes
router.get('/tables', getTables);
router.post('/table-structure', getTableStructure);

// 2. Agrega la nueva ruta para la descarga del CSV
router.get('/download/vehiculos-csv', downloadCsvVehiculos);

export default router;