import { Router } from 'express';
import { handleBarcodeLookup } from '../controllers/barcodeController.js';

const router = Router();

// GET /api/barcode?barcode=123456789
// Rate limited by middleware in server/index.js
router.get('/', handleBarcodeLookup);

export default router;
