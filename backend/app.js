// backend/app.js
//
// Punto de entrada del backend. Cablea middlewares, routers y el manejador de
// errores central. Respeta el flujo routes -> controllers -> services -> engine.
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const airportRoutes = require('./routes/airportRoutes');
const aircraftRoutes = require('./routes/aircraftRoutes');
const routeRoutes = require('./routes/routeRoutes');
const mapsRoutes = require('./routes/mapsRoutes');
const reportRoutes = require('./routes/reportRoutes');
const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./middlewares/errorHandler');
const oauth = require('./config/oauth');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// API REST
app.use('/api/aeropuertos', airportRoutes);
app.use('/api/aeronaves', aircraftRoutes);
app.use('/api/optimizacion', routeRoutes);
app.use('/api/mapas', mapsRoutes);
app.use('/api/reportes', reportRoutes);
app.use('/api/auth', authRoutes);

app.get('/api/status', (_req, res) => {
    res.json({
        status: 'SUCCESS',
        message: 'Orquestador EuroSky Connect operativo.',
        authEnabled: oauth.isConfigured(),
        auth: oauth.isConfigured() ? 'oauth-activo' : 'oauth-desactivado (modo prototipo)',
    });
});

// Manejador de errores: SIEMPRE al final.
app.use(errorHandler);

// Solo levantamos el servidor si se ejecuta directamente (no al hacer require en tests).
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`[EuroSky Connect] Orquestador en http://localhost:${PORT}`);
        if (!oauth.isConfigured()) {
            console.log('[EuroSky Connect] OAuth desactivado: rutas protegidas abiertas (modo desarrollo).');
        }
    });
}

module.exports = app;