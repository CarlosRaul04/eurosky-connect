const costService = require('../services/costService');

try {
    const contrato = costService.buildEngineContract("Airbus A320neo", "LHR");
    // Salida 100% limpia para C++
    console.log(JSON.stringify(contrato));
} catch (error) {
    console.error(error.message);
}