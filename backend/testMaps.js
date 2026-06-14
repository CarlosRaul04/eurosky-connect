require('dotenv').config(); // Carga tu API Key
const mapsService = require('./services/mapsService');

console.log('[Prueba] Iniciando test del servicio de Google Maps...');

mapsService.fetchDistanceMatrix()
    .then(rutas => {
        console.log('\n[Prueba Exitosa] Muestra de la primera ruta guardada:');
        console.log(rutas[0]);
        console.log('\n[Acción] Revisa tu archivo backend/data/routes.json para ver la matriz completa.');
    })
    .catch(error => {
        console.error('\n[Prueba Fallida] Hubo un problema al consultar la API:');
        console.error(error.message);
    });