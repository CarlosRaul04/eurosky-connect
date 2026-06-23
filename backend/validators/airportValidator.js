// backend/validators/airportValidator.js
//
// Validacion de datos de aeropuerto. Funciones puras: devuelven un arreglo de
// errores (vacio = valido). No lanzan ni conocen HTTP.
const CAMPOS = ['iata', 'nombre', 'ciudad', 'pais', 'latitud', 'longitud', 'terminalFeeEUR'];

function esNumero(n) {
    return typeof n === 'number' && Number.isFinite(n);
}

// Validacion completa para creacion (todos los campos requeridos).
function validateCreate(data = {}) {
    const errores = [];

    if (!/^[A-Z]{3}$/.test(data.iata || '')) {
        errores.push('iata debe ser un codigo de 3 letras mayusculas (ej. "LHR").');
    }
    for (const campo of ['nombre', 'ciudad', 'pais']) {
        if (!data[campo] || typeof data[campo] !== 'string') {
            errores.push(`${campo} es obligatorio y debe ser texto.`);
        }
    }
    if (!esNumero(data.latitud) || data.latitud < -90 || data.latitud > 90) {
        errores.push('latitud debe ser un numero entre -90 y 90.');
    }
    if (!esNumero(data.longitud) || data.longitud < -180 || data.longitud > 180) {
        errores.push('longitud debe ser un numero entre -180 y 180.');
    }
    if (!esNumero(data.terminalFeeEUR) || data.terminalFeeEUR < 0) {
        errores.push('terminalFeeEUR debe ser un numero >= 0.');
    }
    return errores;
}

// Validacion parcial para actualizacion (solo los campos presentes).
function validateUpdate(data = {}) {
    const errores = [];
    if ('iata' in data) errores.push('El codigo IATA no puede modificarse.');
    if ('latitud' in data && (!esNumero(data.latitud) || data.latitud < -90 || data.latitud > 90)) {
        errores.push('latitud debe ser un numero entre -90 y 90.');
    }
    if ('longitud' in data && (!esNumero(data.longitud) || data.longitud < -180 || data.longitud > 180)) {
        errores.push('longitud debe ser un numero entre -180 y 180.');
    }
    if ('terminalFeeEUR' in data && (!esNumero(data.terminalFeeEUR) || data.terminalFeeEUR < 0)) {
        errores.push('terminalFeeEUR debe ser un numero >= 0.');
    }
    return errores;
}

module.exports = { validateCreate, validateUpdate, CAMPOS };