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
        const { sessionToken, user } = await authService.handleCallback(code);
        // En un frontend real se redirige con el token; aqui lo devolvemos en JSON.
        res.json({ sessionToken, user });
    } catch (e) { next(e); }
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