// backend/routes/mapsRoutes.js
//
// Recalculo de la matriz de distancias.  /api/mapas
const express = require('express');
const router = express.Router();
const mapsController = require('../controllers/mapsController.js');
const { protect } = require('../middlewares/authMiddleware');

router.post('/refresh', protect, mapsController.refresh);

module.exports = router;