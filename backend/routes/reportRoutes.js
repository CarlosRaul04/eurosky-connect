// backend/routes/reportRoutes.js
//
// Reportes de la ultima jornada.  /api/reportes
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/comparativa', reportController.comparativa);
router.get('/itinerario.csv', reportController.itinerarioCSV);

module.exports = router;