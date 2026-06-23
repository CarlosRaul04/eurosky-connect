// backend/repositories/routeRepository.js
//
// Acceso a la matriz de distancias (routes.json).
const store = require('./jsonStore');

const FILE = 'routes.json';

function findAll() {
    return store.read(FILE) || [];
}

function saveAll(rutas) {
    return store.write(FILE, rutas);
}

module.exports = { findAll, saveAll };