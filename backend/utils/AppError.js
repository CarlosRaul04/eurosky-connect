// backend/utils/AppError.js
//
// Error de dominio con codigo HTTP asociado. Permite que los servicios lancen
// errores semanticos (404, 409, 400...) y que un unico middleware los traduzca
// a respuestas HTTP coherentes.
class AppError extends Error {
    constructor(statusCode, message, details = null) {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;
        this.details = details;
    }
}

module.exports = AppError;