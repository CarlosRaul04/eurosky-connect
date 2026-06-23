// backend/config/googleMaps.js
//
// Configuracion centralizada de Google Maps Platform. La API key se lee de
// variables de entorno (RNF-06); NUNCA debe estar en el codigo ni en los JSON.
module.exports = {
    API_KEY: process.env.GOOGLE_MAPS_API_KEY || '',
    ROUTE_MATRIX_URL: 'https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix',
    GEOCODING_URL: 'https://maps.googleapis.com/maps/api/geocode/json',

    isConfigured() {
        return Boolean(this.API_KEY);
    },
};