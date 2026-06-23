// backend/services/mapsService.js
//
// Construye la matriz de distancias geograficas entre los aeropuertos y la
// persiste via routeRepository. NO almacena tiempos: el tiempo de vuelo es una
// magnitud derivada (distancia / velocidad de crucero) que calcula costService.
//
// Modos:
//   - real:    Google Routes API (Compute Route Matrix) si hay API key.
//   - offline: distancia de circulo maximo (haversine). Permite trabajar y
//              probar sin clave ni cuota.
const airportRepository = require('../repositories/airportRepository');
const routeRepository = require('../repositories/routeRepository');
const googleMaps = require('../config/googleMaps');

const RADIO_TIERRA_KM = 6371;

function haversineKm(a, b) {
    const toRad = (g) => (g * Math.PI) / 180;
    const dLat = toRad(b.latitud - a.latitud);
    const dLon = toRad(b.longitud - a.longitud);
    const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(a.latitud)) * Math.cos(toRad(b.latitud)) * Math.sin(dLon / 2) ** 2;
    return 2 * RADIO_TIERRA_KM * Math.asin(Math.sqrt(h));
}

function computeOffline(aeropuertos) {
    const rutas = [];
    for (const origen of aeropuertos) {
        for (const destino of aeropuertos) {
            if (origen.iata === destino.iata) continue;
            rutas.push({
                origenIATA: origen.iata,
                destinoIATA: destino.iata,
                distanciaKm: Number(haversineKm(origen, destino).toFixed(2)),
            });
        }
    }
    return rutas;
}

async function fetchRoutesApi(aeropuertos) {
    const waypoints = aeropuertos.map((a) => ({
        waypoint: { location: { latLng: { latitude: a.latitud, longitude: a.longitud } } },
    }));

    const response = await fetch(googleMaps.ROUTE_MATRIX_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': googleMaps.API_KEY,
            'X-Goog-FieldMask': 'originIndex,destinationIndex,distanceMeters,condition',
        },
        body: JSON.stringify({
            origins: waypoints,
            destinations: waypoints,
            travelMode: 'DRIVE',
            routingPreference: 'ROUTING_PREFERENCE_UNSPECIFIED',
        }),
    });

    if (!response.ok) {
        throw new Error(`Routes API HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    const rutas = [];
    for (const el of data) {
        if (el.originIndex === el.destinationIndex || el.condition !== 'ROUTE_EXISTS') continue;
        rutas.push({
            origenIATA: aeropuertos[el.originIndex].iata,
            destinoIATA: aeropuertos[el.destinationIndex].iata,
            distanciaKm: Number((el.distanceMeters / 1000).toFixed(2)),
        });
    }
    return rutas;
}

async function refreshDistanceMatrix() {
    const aeropuertos = airportRepository.findAll();
    const rutas = googleMaps.isConfigured()
        ? await fetchRoutesApi(aeropuertos)
        : computeOffline(aeropuertos);

    routeRepository.saveAll(rutas);
    return { modo: googleMaps.isConfigured() ? 'routes-api' : 'offline-haversine', pares: rutas.length };
}

module.exports = { refreshDistanceMatrix };