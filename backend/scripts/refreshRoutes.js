// backend/scripts/refreshRoutes.js
//
// Regenera data/routes.json con la matriz de distancias geograficas.
// Usa Google Routes API si hay GOOGLE_MAPS_API_KEY en .env; si no, calcula
// las distancias por haversine (modo offline).
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mapsService = require('../services/mapsService');

mapsService
    .refreshDistanceMatrix()
    .then((info) => {
        console.log(`[refreshRoutes] ${info.pares} pares guardados en routes.json (modo: ${info.modo}).`);
    })
    .catch((error) => {
        console.error(`[refreshRoutes] Error: ${error.message}`);
        process.exit(1);
    });