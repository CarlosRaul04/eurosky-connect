// backend/routes/routeRoutes.js
//
// Optimizacion de la jornada.  /api/optimizacion
// Flujo: routes -> controller -> services -> engine.
const express = require('express');
const router = express.Router();
const routeController = require('../controllers/routeController');
const { protect } = require('../middlewares/authMiddleware');

// POST body: { aeronave?, origen, maxJourneyHours?, layoverHours?, seed? }
router.post('/', protect, routeController.optimizar);

module.exports = router;