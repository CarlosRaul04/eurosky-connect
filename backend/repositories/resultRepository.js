// backend/repositories/resultRepository.js
//
// Persistencia del ultimo resultado de optimizacion (result.json).
const store = require('./jsonStore');

const FILE = 'result.json';

function save(resultado) {
    return store.write(FILE, resultado);
}

function get() {
    return store.read(FILE);
}

module.exports = { save, get };