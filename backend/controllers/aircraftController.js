// backend/controllers/aircraftController.js
//
// CRUD de aeronaves. Traduce HTTP <-> aircraftService.
const aircraftService = require('../services/aircraftService');

async function listar(_req, res, next) {
    try { res.json(aircraftService.listar()); } catch (e) { next(e); }
}

async function obtener(req, res, next) {
    try { res.json(aircraftService.obtener(req.params.modelo)); } catch (e) { next(e); }
}

async function crear(req, res, next) {
    try { res.status(201).json(aircraftService.crear(req.body)); } catch (e) { next(e); }
}

async function actualizar(req, res, next) {
    try { res.json(aircraftService.actualizar(req.params.modelo, req.body)); } catch (e) { next(e); }
}

async function eliminar(req, res, next) {
    try { res.json(aircraftService.eliminar(req.params.modelo)); } catch (e) { next(e); }
}

module.exports = { listar, obtener, crear, actualizar, eliminar };