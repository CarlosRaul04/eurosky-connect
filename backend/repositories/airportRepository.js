// backend/repositories/airportRepository.js
//
// Acceso a la coleccion de aeropuertos (airports.json). Clave: codigo IATA.
const store = require('./jsonStore');

const FILE = 'airports.json';

function findAll() {
    return store.read(FILE) || [];
}

function findByIata(iata) {
    return findAll().find((a) => a.iata === iata) || null;
}

function exists(iata) {
    return findByIata(iata) !== null;
}

function create(aeropuerto) {
    const todos = findAll();
    todos.push(aeropuerto);
    store.write(FILE, todos);
    return aeropuerto;
}

function update(iata, cambios) {
    const todos = findAll();
    const i = todos.findIndex((a) => a.iata === iata);
    if (i === -1) return null;
    todos[i] = { ...todos[i], ...cambios, iata }; // el IATA es inmutable
    store.write(FILE, todos);
    return todos[i];
}

function remove(iata) {
    const todos = findAll();
    const restantes = todos.filter((a) => a.iata !== iata);
    if (restantes.length === todos.length) return false;
    store.write(FILE, restantes);
    return true;
}

module.exports = { findAll, findByIata, exists, create, update, remove };