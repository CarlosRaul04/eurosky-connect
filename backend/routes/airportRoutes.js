// backend/routes/airportRoutes.js
//
// CRUD de aeropuertos.  /api/aeropuertos
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/airportController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/', ctrl.listar);
router.get('/:iata', ctrl.obtener);
router.post('/', protect, ctrl.crear);
router.put('/:iata', protect, ctrl.actualizar);
router.delete('/:iata', protect, ctrl.eliminar);

module.exports = router;