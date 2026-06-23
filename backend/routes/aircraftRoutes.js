// backend/routes/aircraftRoutes.js
//
// CRUD de aeronaves.  /api/aeronaves
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/aircraftController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/', ctrl.listar);
router.get('/:modelo', ctrl.obtener);
router.post('/', protect, ctrl.crear);
router.put('/:modelo', protect, ctrl.actualizar);
router.delete('/:modelo', protect, ctrl.eliminar);

module.exports = router;