// backend/config/oauth.js
//
// Configuracion de Google OAuth 2.0 (flujo Authorization Code, RF-18).
// Las credenciales se leen del entorno. Si no estan configuradas, la
// autenticacion queda deshabilitada y el prototipo funciona sin login.
module.exports = {
    CLIENT_ID: process.env.GOOGLE_OAUTH_CLIENT_ID || '',
    CLIENT_SECRET: process.env.GOOGLE_OAUTH_CLIENT_SECRET || '',
    REDIRECT_URI: process.env.GOOGLE_OAUTH_REDIRECT_URI || 'http://localhost:3000/api/auth/callback',
    AUTH_URL: 'https://accounts.google.com/o/oauth2/v2/auth',
    TOKEN_URL: 'https://oauth2.googleapis.com/token',
    USERINFO_URL: 'https://www.googleapis.com/oauth2/v2/userinfo',
    SCOPE: 'openid email profile',

    isConfigured() {
        return Boolean(this.CLIENT_ID && this.CLIENT_SECRET);
    },
};