import express from 'express';
import { getTables, getTableStructure } from '../controllers/systemController.js';

const router = express.Router();

router.get('/tables', getTables);
router.post('/table-structure', getTableStructure);

export default router;