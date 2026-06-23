// backend/services/aircraftService.js
//
// Reglas de negocio del CRUD de aeronaves (la flota rentable).
const aircraftRepository = require('../repositories/aircraftRepository');
const validator = require('../validators/aircraftValidator');
const AppError = require('../utils/AppError');

function listar() {
    return aircraftRepository.findAll();
}

function obtener(modelo) {
    const aeronave = aircraftRepository.findByModel(modelo);
    if (!aeronave) throw new AppError(404, `Aeronave "${modelo}" no encontrada.`);
    return aeronave;
}

function crear(data) {
    const errores = validator.validateCreate(data);
    if (errores.length) throw new AppError(400, 'Datos de aeronave invalidos.', errores);

    if (aircraftRepository.exists(data.modelo)) {
        throw new AppError(409, `Ya existe la aeronave "${data.modelo}".`);
    }

    const aeronave = {
        modelo: data.modelo,
        capacidad_max: data.capacidad_max,
        // Si no se envia umbral, se calcula como 70% de la capacidad.
        umbral_min: data.umbral_min ?? validator.calcularUmbral(data.capacidad_max),
        mu_demanda: data.mu_demanda,
        sigma_demanda: data.sigma_demanda,
        leasing_usd_hora: data.leasing_usd_hora,
        consumo_kg_km: data.consumo_kg_km,
        autonomia_km: data.autonomia_km,
    };
    return aircraftRepository.create(aeronave);
}

function actualizar(modelo, cambios) {
    const errores = validator.validateUpdate(cambios);
    if (errores.length) throw new AppError(400, 'Cambios de aeronave invalidos.', errores);

    // Si cambia la capacidad y no se envia umbral, se recalcula el 70%.
    if ('capacidad_max' in cambios && !('umbral_min' in cambios)) {
        cambios.umbral_min = validator.calcularUmbral(cambios.capacidad_max);
    }

    const actualizada = aircraftRepository.update(modelo, cambios);
    if (!actualizada) throw new AppError(404, `Aeronave "${modelo}" no encontrada.`);
    return actualizada;
}

function eliminar(modelo) {
    const ok = aircraftRepository.remove(modelo);
    if (!ok) throw new AppError(404, `Aeronave "${modelo}" no encontrada.`);
    return { modelo, eliminado: true };
}

module.exports = { listar, obtener, crear, actualizar, eliminar };