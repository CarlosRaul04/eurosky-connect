// backend/services/airportService.js
//
// Reglas de negocio del CRUD de aeropuertos. Orquesta repositorio + validador
// y lanza AppError con el codigo HTTP adecuado. No conoce Express.
const airportRepository = require('../repositories/airportRepository');
const validator = require('../validators/airportValidator');
const AppError = require('../utils/AppError');

function listar() {
    return airportRepository.findAll();
}

function obtener(iata) {
    const aeropuerto = airportRepository.findByIata(iata);
    if (!aeropuerto) throw new AppError(404, `Aeropuerto "${iata}" no encontrado.`);
    return aeropuerto;
}

function crear(data) {
    const errores = validator.validateCreate(data);
    if (errores.length) throw new AppError(400, 'Datos de aeropuerto invalidos.', errores);

    if (airportRepository.exists(data.iata)) {
        throw new AppError(409, `Ya existe un aeropuerto con IATA "${data.iata}".`);
    }

    const aeropuerto = {
        iata: data.iata,
        nombre: data.nombre,
        ciudad: data.ciudad,
        pais: data.pais,
        latitud: data.latitud,
        longitud: data.longitud,
        terminalFeeEUR: data.terminalFeeEUR,
    };
    return airportRepository.create(aeropuerto);
}

function actualizar(iata, cambios) {
    const errores = validator.validateUpdate(cambios);
    if (errores.length) throw new AppError(400, 'Cambios de aeropuerto invalidos.', errores);

    const actualizado = airportRepository.update(iata, cambios);
    if (!actualizado) throw new AppError(404, `Aeropuerto "${iata}" no encontrado.`);
    return actualizado;
}

function eliminar(iata) {
    const ok = airportRepository.remove(iata);
    if (!ok) throw new AppError(404, `Aeropuerto "${iata}" no encontrado.`);
    // Aviso: al cambiar la red, la matriz routes.json queda desactualizada;
    // el cliente deberia llamar a POST /api/mapas/refresh.
    return { iata, eliminado: true, aviso: 'Ejecuta el refresh de rutas para recalcular la matriz.' };
}

module.exports = { listar, obtener, crear, actualizar, eliminar };