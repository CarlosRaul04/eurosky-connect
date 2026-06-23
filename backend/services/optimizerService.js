// backend/services/optimizerService.js
//
// Servicio de alto nivel: coordina el flujo de optimizacion
//   costService (pesos)  ->  motorBridge (algoritmos C++)  ->  resultRepository
const costService = require('./costService');
const motorBridge = require('../engine/motorBridge');
const resultRepository = require('../repositories/resultRepository');

async function optimizarJornada(modeloAeronave, origenIATA, opciones = {}) {
    const contrato = costService.buildEngineContract(modeloAeronave, origenIATA, opciones);
    const resultado = await motorBridge.ejecutar(contrato);
    resultRepository.save(resultado);
    return resultado;
}

module.exports = { optimizarJornada };