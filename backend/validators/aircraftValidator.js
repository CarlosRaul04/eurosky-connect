// backend/validators/aircraftValidator.js
//
// Validacion de datos de aeronave. El umbral del 70% se calcula solo si no se
// provee, para mantener coherencia con la regla de negocio (factor de carga).
function esNumero(n) {
    return typeof n === 'number' && Number.isFinite(n);
}

function validateCreate(data = {}) {
    const errores = [];

    if (!data.modelo || typeof data.modelo !== 'string') {
        errores.push('modelo es obligatorio y debe ser texto.');
    }
    if (!Number.isInteger(data.capacidad_max) || data.capacidad_max <= 0) {
        errores.push('capacidad_max debe ser un entero > 0.');
    }
    if ('umbral_min' in data) {
        if (!Number.isInteger(data.umbral_min) || data.umbral_min <= 0) {
            errores.push('umbral_min debe ser un entero > 0.');
        } else if (esNumero(data.capacidad_max) && data.umbral_min > data.capacidad_max) {
            errores.push('umbral_min no puede superar capacidad_max.');
        }
    }
    for (const campo of ['mu_demanda', 'sigma_demanda', 'leasing_usd_hora', 'consumo_kg_km', 'autonomia_km']) {
        if (!esNumero(data[campo]) || data[campo] <= 0) {
            errores.push(`${campo} debe ser un numero > 0.`);
        }
    }
    return errores;
}

function validateUpdate(data = {}) {
    const errores = [];
    if ('modelo' in data) errores.push('El modelo es la clave y no puede modificarse.');
    if ('capacidad_max' in data && (!Number.isInteger(data.capacidad_max) || data.capacidad_max <= 0)) {
        errores.push('capacidad_max debe ser un entero > 0.');
    }
    for (const campo of ['mu_demanda', 'sigma_demanda', 'leasing_usd_hora', 'consumo_kg_km', 'autonomia_km']) {
        if (campo in data && (!esNumero(data[campo]) || data[campo] <= 0)) {
            errores.push(`${campo} debe ser un numero > 0.`);
        }
    }
    return errores;
}

// Umbral del 70% de la capacidad (factor de carga minimo rentable).
function calcularUmbral(capacidadMax) {
    return Math.round(0.7 * capacidadMax);
}

module.exports = { validateCreate, validateUpdate, calcularUmbral };