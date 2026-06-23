// backend/controllers/routeController.js
//
// Controlador de OPTIMIZACION. Valida la entrada minima e invoca
// optimizerService. El status HTTP refleja si hubo itinerario rentable.
const optimizerService = require('../services/optimizerService');
const AppError = require('../utils/AppError');

const AERONAVE_DEFECTO = 'Airbus A320neo';

async function optimizar(req, res, next) {
    try {
        const { aeronave = AERONAVE_DEFECTO, origen, maxJourneyHours, layoverHours, seed } =
            req.body || {};

        if (!origen) throw new AppError(400, 'Falta el aeropuerto de origen (origen).');

        const resultado = await optimizerService.optimizarJornada(aeronave, origen, {
            maxJourneyHours, layoverHours, seed,
        });

        res.status(resultado.status === 'OK' ? 200 : 422).json(resultado);
    } catch (e) {
        next(e);
    }
}

module.exports = { optimizar };