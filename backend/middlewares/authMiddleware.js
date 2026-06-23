// backend/middlewares/authMiddleware.js
//
// Protege rutas con la sesion de Google OAuth. Si OAuth no esta configurado,
// deja pasar (modo prototipo) para no bloquear el desarrollo del frontend.
const oauth = require('../config/oauth');
const authService = require('../services/authService');
const AppError = require('../utils/AppError');

function protect(req, _res, next) {
    if (!oauth.isConfigured()) return next(); // modo abierto en desarrollo

    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    const user = token && authService.getSession(token);

    if (!user) return next(new AppError(401, 'Autenticacion requerida.'));
    req.user = user;
    return next();
}

module.exports = { protect };