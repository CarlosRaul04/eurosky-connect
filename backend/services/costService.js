// backend/services/costService.js
//
// A partir de la matriz de distancias (routeRepository) y la aeronave
// seleccionada (aircraftRepository), calcula los pesos economicos de cada
// arista y arma el CONTRATO JSON que se inyecta por stdin al motor C++.
//
// El tiempo de vuelo se deriva de la velocidad de crucero (distancia / 840),
// no del tiempo de conduccion.
const airportRepository = require('../repositories/airportRepository');
const aircraftRepository = require('../repositories/aircraftRepository');
const routeRepository = require('../repositories/routeRepository');
const AppError = require('../utils/AppError');

// Constantes del modelo (Seccion 4 del documento).
const PARAMS = Object.freeze({
    VELOCIDAD_CRUCERO_KMH: 840,
    PRECIO_JETA1_EUR_KG: 0.72,
    FACTOR_RESERVA_COMBUSTIBLE: 1.08,
    TASA_ENR_EUR_KM: 0.75,
    EUR_USD: 1.09, // 1 EUR = 1.09 USD -> USD a EUR se divide entre 1.09
    TARIFA_BASE_EUR: 40,
    COEF_PRECIO_EUR_KM: 0.11,
    MAX_JOURNEY_HOURS: 8.0,
    LAYOVER_HOURS: 0.5,
});

const round2 = (n) => Number(n.toFixed(2));

function calcularTramo(distanciaKm, aeronave, terminalFeeDestinoEUR) {
    const cFuel =
        aeronave.consumo_kg_km * distanciaKm *
        PARAMS.FACTOR_RESERVA_COMBUSTIBLE * PARAMS.PRECIO_JETA1_EUR_KG;
    const cEnr = PARAMS.TASA_ENR_EUR_KM * distanciaKm;
    const tiempoVueloH = distanciaKm / PARAMS.VELOCIDAD_CRUCERO_KMH;
    const cLeas = (aeronave.leasing_usd_hora / PARAMS.EUR_USD) * tiempoVueloH;
    const cTns = terminalFeeDestinoEUR;

    return {
        tiempoVueloH,
        costoTotalEUR: cFuel + cEnr + cLeas + cTns,
        precioBoletoEUR: PARAMS.TARIFA_BASE_EUR + PARAMS.COEF_PRECIO_EUR_KM * distanciaKm,
    };
}

function buildEngineContract(modeloAeronave, origenIATA, opciones = {}) {
    const aeronave = aircraftRepository.findByModel(modeloAeronave);
    if (!aeronave) throw new AppError(404, `Aeronave "${modeloAeronave}" no encontrada en la flota.`);
    if (!airportRepository.exists(origenIATA)) {
        throw new AppError(404, `Aeropuerto de origen "${origenIATA}" no existe en la red.`);
    }

    const rutas = routeRepository.findAll();
    if (!rutas.length) {
        throw new AppError(409, 'No hay matriz de rutas. Ejecuta el refresh de mapas primero.');
    }

    const terminalFee = Object.fromEntries(
        airportRepository.findAll().map((a) => [a.iata, a.terminalFeeEUR])
    );

    // Defensa: ignora rutas cuya matriz quedo desactualizada (algun extremo ya
    // no existe en la red). Evita propagar NaN/null al motor.
    const routesCalculadas = rutas
        .filter((r) => terminalFee[r.origenIATA] !== undefined && terminalFee[r.destinoIATA] !== undefined)
        .map((r) => {
            const t = calcularTramo(r.distanciaKm, aeronave, terminalFee[r.destinoIATA]);
            return {
                origin: r.origenIATA,
                destination: r.destinoIATA,
                distanceKm: round2(r.distanciaKm),
                flightTimeHours: round2(t.tiempoVueloH),
                costTotalEUR: round2(t.costoTotalEUR),
                ticketPriceEUR: round2(t.precioBoletoEUR),
            };
        });

    return {
        originIATA: origenIATA,
        maxJourneyHours: opciones.maxJourneyHours ?? PARAMS.MAX_JOURNEY_HOURS,
        layoverHours: opciones.layoverHours ?? PARAMS.LAYOVER_HOURS,
        monteCarloSeed: opciones.seed ?? null,
        aircraft: {
            model: aeronave.modelo,
            maxCapacity: aeronave.capacidad_max,
            minThreshold: aeronave.umbral_min,
            mu: aeronave.mu_demanda,
            sigma: aeronave.sigma_demanda,
        },
        routes: routesCalculadas,
    };
}

module.exports = { buildEngineContract, PARAMS };