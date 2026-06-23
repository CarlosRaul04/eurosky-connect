// backend/controllers/reportController.js
//
// Reportes de la ultima jornada optimizada: comparativa (JSON) y CSV (RF-16).
const reportService = require('../services/reportService');

async function comparativa(_req, res, next) {
    try { res.json(reportService.comparativa()); } catch (e) { next(e); }
}

async function itinerarioCSV(_req, res, next) {
    try {
        const csv = reportService.itinerarioOptimoCSV();
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="itinerario.csv"');
        res.send(csv);
    } catch (e) {
        next(e);
    }
}

module.exports = { comparativa, itinerarioCSV };