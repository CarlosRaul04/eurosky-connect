// backend/scripts/generateInput.js
//
// Utilidad de linea de comandos: genera el contrato JSON y lo imprime por
// stdout, listo para encadenar con el motor:
//
//   node backend/scripts/generateInput.js | motor/build/motor
//
// Uso: node generateInput.js [modeloAeronave] [origenIATA] [seed]
const costService = require('../services/costService');

const modelo = process.argv[2] || 'Airbus A320neo';
const origen = process.argv[3] || 'FRA';
const seed = process.argv[4] ? Number(process.argv[4]) : null;

try {
    const contrato = costService.buildEngineContract(modelo, origen, { seed });
    process.stdout.write(JSON.stringify(contrato));
} catch (error) {
    process.stderr.write(`[generateInput] ${error.message}\n`);
    process.exit(1);
}