// backend/services/mapsService.js
const fs = require('fs');
const path = require('path');

const airportsPath = path.join(__dirname, '../data/airports.json');
const routesPath = path.join(__dirname, '../data/routes.json');

class MapsService {
    async fetchDistanceMatrix() {
        try {
            console.log('[EuroSky Connect] Iniciando consulta a Google Maps (Routes API V2)...');
            
            // 1. Leer los 15 aeropuertos
            const airportsData = fs.readFileSync(airportsPath, 'utf8');
            const airports = JSON.parse(airportsData);

            // 2. Formatear los waypoints según la documentación oficial
            const waypoints = airports.map(airport => ({
                waypoint: {
                    location: {
                        latLng: {
                            latitude: airport.latitud,
                            longitude: airport.longitud
                        }
                    }
                }
            }));

            const url = 'https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix';
            
            // 3. Configurar headers y el X-Goog-FieldMask exacto
            const headers = {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': process.env.GOOGLE_MAPS_API_KEY,
                'X-Goog-FieldMask': 'originIndex,destinationIndex,duration,distanceMeters,status,condition'
            };

            const body = JSON.stringify({
                origins: waypoints,
                destinations: waypoints,
                travelMode: 'DRIVE', 
                routingPreference: 'ROUTING_PREFERENCE_UNSPECIFIED'
            });

            console.log(`[EuroSky Connect] Enviando matriz completa (15x15 = 225 elementos) en una sola petición...`);
            
            // 4. Ejecutar la llamada
            const response = await fetch(url, { method: 'POST', headers, body });
            
            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Error HTTP ${response.status}: ${errText}`);
            }

            const data = await response.json();
            const allRoutes = [];

            // 5. Procesar la respuesta JSON
            data.forEach(element => {
                // Filtramos rutas hacia el mismo aeropuerto (ej. LHR a LHR) y validamos que la ruta exista
                if (element.originIndex !== element.destinationIndex && element.condition === 'ROUTE_EXISTS') {
                    const origin = airports[element.originIndex];
                    const dest = airports[element.destinationIndex];
                    
                    allRoutes.push({
                        origenIATA: origin.iata,
                        destinoIATA: dest.iata,
                        // Convertir de metros a kilómetros
                        distanciaKm: element.distanceMeters / 1000,
                        // El tiempo viene como "160s", quitamos la 's' y convertimos a horas
                        tiempoHoras: parseInt(element.duration.replace('s', '')) / 3600
                    });
                }
            });

            // 6. Guardar en disco
            fs.writeFileSync(routesPath, JSON.stringify(allRoutes, null, 2));
            console.log(`\n[EuroSky Connect] ¡Éxito! ${allRoutes.length} rutas guardadas en routes.json`);
            return allRoutes;

        } catch (error) {
            console.error('[Error en MapsService]:', error.message);
            throw error;
        }
    }
}

module.exports = new MapsService();