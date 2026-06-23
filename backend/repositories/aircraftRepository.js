// backend/repositories/aircraftRepository.js
//
// Acceso a la flota disponible (aircraft.json). Clave: modelo.
const store = require('./jsonStore');

const FILE = 'aircraft.json';

function findAll() {
    return store.read(FILE) || [];
}

function findByModel(modelo) {
    return findAll().find((a) => a.modelo === modelo) || null;
}

function exists(modelo) {
    return findByModel(modelo) !== null;
}

function create(aeronave) {
    const todas = findAll();
    todas.push(aeronave);
    store.write(FILE, todas);
    return aeronave;
}

function update(modelo, cambios) {
    const todas = findAll();
    const i = todas.findIndex((a) => a.modelo === modelo);
    if (i === -1) return null;
    todas[i] = { ...todas[i], ...cambios, modelo }; // el modelo es la clave
    store.write(FILE, todas);
    return todas[i];
}

function remove(modelo) {
    const todas = findAll();
    const restantes = todas.filter((a) => a.modelo !== modelo);
    if (restantes.length === todas.length) return false;
    store.write(FILE, restantes);
    return true;
}

module.exports = { findAll, findByModel, exists, create, update, remove };