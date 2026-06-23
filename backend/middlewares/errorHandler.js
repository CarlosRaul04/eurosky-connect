// backend/middlewares/errorHandler.js
//
// Manejador de errores central. Traduce AppError a su codigo HTTP; cualquier
// otro error se reporta como 500. Unifica el formato de error de la API.
const AppError = require('../utils/AppError');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            error: err.message,
            ...(err.details ? { detalles: err.details } : {}),
        });
    }
    console.error('[Error no controlado]', err);
    return res.status(500).json({ error: 'Error interno del servidor.' });
}

module.exports = errorHandler;