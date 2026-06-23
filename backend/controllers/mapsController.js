// backend/controllers/mapsController.js
//
// Dispara el recalculo de la matriz de distancias (routes.json). Util tras
// crear/editar/eliminar aeropuertos.
const mapsService = require('../services/mapsService');

async function refresh(_req, res, next) {
    try {
        const info = await mapsService.refreshDistanceMatrix();
        res.json({ mensaje: 'Matriz de rutas actualizada.', ...info });
    } catch (e) {
        next(e);
    }
}

module.exports = { refresh };