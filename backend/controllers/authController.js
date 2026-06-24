// backend/controllers/authController.js
//
// Endpoints de autenticacion Google OAuth 2.0.
const authService = require('../services/authService');

async function login(_req, res, next) {
    try {
        const { url } = authService.getAuthUrl();
        res.json({ authUrl: url });
    } catch (e) { next(e); }
}

async function callback(req, res, next) {
    try {
        const { code } = req.query;
        const { sessionToken } = await authService.handleCallback(code);
        // Redirige al frontend con el token en el fragmento (#): asi no viaja al
        // servidor en peticiones posteriores ni queda en logs. El SPA lo captura.
        res.redirect(`/#access=${sessionToken}`);
    } catch (e) {
        // Ante un fallo de OAuth, vuelve al frontend con un aviso en lugar de un JSON crudo.
        res.redirect(`/#auth_error=${encodeURIComponent(e.message || 'oauth_failed')}`);
    }
}

async function me(req, res) {
    res.json({ user: req.user || null });
}

async function logout(req, res) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    authService.logout(token);
    res.json({ ok: true });
}

module.exports = { login, callback, me, logout };