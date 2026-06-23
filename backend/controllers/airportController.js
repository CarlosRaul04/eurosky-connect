// backend/controllers/airportController.js
//
// CRUD de aeropuertos. Traduce HTTP <-> airportService. Sin logica de negocio.
const airportService = require('../services/airportService');

async function listar(_req, res, next) {
    try { 
        res.json(airportService.listar()); 
    } catch (e) { 
        next(e); 
    }
}

async function obtener(req, res, next) {
    try { 
        res.json(airportService.obtener(req.params.iata)); 
    } catch (e) { 
        next(e); 
    }
}

async function crear(req, res, next) {
    try { 
        res.status(201).json(airportService.crear(req.body)); 
    } catch (e) { 
        next(e); 
    }
}

async function actualizar(req, res, next) {
    try { 
        res.json(airportService.actualizar(req.params.iata, req.body)); 
    } catch (e) { 
        next(e); 
    }
}

async function eliminar(req, res, next) {
    try { 
        res.json(airportService.eliminar(req.params.iata)); 
    } catch (e) { 
        next(e); 
    }
}

module.exports = { listar, obtener, crear, actualizar, eliminar };