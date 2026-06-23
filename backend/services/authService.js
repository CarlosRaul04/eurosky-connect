// backend/services/authService.js
//
// Google OAuth 2.0 - flujo Authorization Code (RF-18).
//   1. getAuthUrl()      -> URL de consentimiento de Google.
//   2. handleCallback()  -> intercambia el code por tokens y obtiene el perfil.
//   3. getSession()      -> valida el token de sesion propio.
//
// Las sesiones se guardan en memoria (Map): es un prototipo y la persistencia
// del sistema se limita a archivos JSON (sin base de datos, RR-06).
const crypto = require('crypto');
const oauth = require('../config/oauth');
const AppError = require('../utils/AppError');

const sesiones = new Map(); // sessionToken -> { user, creado }

function getAuthUrl(state = crypto.randomBytes(16).toString('hex')) {
    if (!oauth.isConfigured()) {
        throw new AppError(503, 'OAuth no esta configurado (faltan CLIENT_ID/SECRET).');
    }
    const params = new URLSearchParams({
        client_id: oauth.CLIENT_ID,
        redirect_uri: oauth.REDIRECT_URI,
        response_type: 'code',
        scope: oauth.SCOPE,
        access_type: 'offline',
        prompt: 'consent',
        state,
    });
    return { url: `${oauth.AUTH_URL}?${params.toString()}`, state };
}

async function handleCallback(code) {
    if (!oauth.isConfigured()) {
        throw new AppError(503, 'OAuth no esta configurado.');
    }
    if (!code) throw new AppError(400, 'Falta el parametro "code" de Google.');

    // Intercambio del code por tokens.
    const tokenResp = await fetch(oauth.TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            code,
            client_id: oauth.CLIENT_ID,
            client_secret: oauth.CLIENT_SECRET,
            redirect_uri: oauth.REDIRECT_URI,
            grant_type: 'authorization_code',
        }),
    });
    if (!tokenResp.ok) {
        throw new AppError(401, `Fallo el intercambio de tokens: ${await tokenResp.text()}`);
    }
    const { access_token } = await tokenResp.json();

    // Perfil del usuario.
    const userResp = await fetch(oauth.USERINFO_URL, {
        headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!userResp.ok) throw new AppError(401, 'No se pudo obtener el perfil del usuario.');
    const perfil = await userResp.json();

    // Token de sesion propio (no exponemos el token de Google al frontend).
    const sessionToken = crypto.randomBytes(24).toString('hex');
    const user = { id: perfil.id, email: perfil.email, nombre: perfil.name, foto: perfil.picture };
    sesiones.set(sessionToken, { user, creado: Date.now() });

    return { sessionToken, user };
}

function getSession(sessionToken) {
    const s = sesiones.get(sessionToken);
    return s ? s.user : null;
}

function logout(sessionToken) {
    return sesiones.delete(sessionToken);
}

module.exports = { getAuthUrl, handleCallback, getSession, logout };