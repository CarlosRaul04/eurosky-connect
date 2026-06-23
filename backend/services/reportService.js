// backend/services/reportService.js
//
// Genera reportes a partir del ultimo resultado de optimizacion (result.json):
//   - resumen comparativo de algoritmos
//   - desglose del itinerario optimo en CSV (RF-15 / RF-16)
const resultRepository = require('../repositories/resultRepository');
const AppError = require('../utils/AppError');

function ultimoResultado() {
    const r = resultRepository.get();
    if (!r || Array.isArray(r)) {
        throw new AppError(404, 'Aun no hay un resultado de optimizacion para reportar.');
    }
    return r;
}

// Tabla comparativa (objeto JS, lista para enviar al frontend).
function comparativa() {
    return ultimoResultado().comparison || [];
}

function escaparCSV(valor) {
    const v = typeof valor === 'number' ? Number(valor.toFixed(2)) : valor;
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// CSV con el desglose por tramo del itinerario optimo (DFS).
function itinerarioOptimoCSV() {
    const r = ultimoResultado();
    const dfs = r.itineraries && r.itineraries.dfsExact;
    if (!dfs || !dfs.valido) {
        throw new AppError(409, 'El ultimo resultado no contiene un itinerario optimo valido.');
    }

    const cabecera = ['origen', 'destino', 'pax', 'tiempoVueloH', 'costoEUR', 'beneficioEUR'];
    const filas = dfs.tramos.map((t) =>
        [t.origen, t.destino, t.pax, t.tiempoVueloH, t.costoEUR, t.beneficioEUR]
            .map(escaparCSV)
            .join(',')
    );

    const totales = [
        'TOTAL', '', '',
        dfs.tiempoJornadaH, dfs.costoTotalEUR, dfs.beneficioTotalEUR,
    ].map(escaparCSV).join(',');

    return [cabecera.join(','), ...filas, totales].join('\n');
}

module.exports = { comparativa, itinerarioOptimoCSV };