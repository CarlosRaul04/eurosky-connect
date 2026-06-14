// backend/services/costService.js
const fs = require('fs');
const path = require('path');

class CostService {
    buildEngineContract(aeronaveModelo, origenIATA, maxFlightHours = 8.0) {
        try {
            // 1. Leer nuestra base de datos JSON
            const airports = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/airports.json'), 'utf8'));
            const aircrafts = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/aircraft.json'), 'utf8'));
            const routes = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/routes.json'), 'utf8'));

            // 2. Buscar la aeronave seleccionada
            const aeronave = aircrafts.find(a => a.modelo === aeronaveModelo);
            if (!aeronave) throw new Error(`Aeronave ${aeronaveModelo} no encontrada en la flota.`);

            // 3. Crear un mapa (diccionario) de tasas terminales para acceso rápido
            const terminalFees = {};
            airports.forEach(a => terminalFees[a.iata] = a.terminalFeeEUR);

            const rutasCalculadas = [];

            // 4. Aplicar las matemáticas del RF-06 y RF-08 a cada ruta
            routes.forEach(ruta => {
                const dist = ruta.distanciaKm;

                // Fórmulas financieras (Sección 4.4 del documento)
                const c_enr = 0.75 * dist;
                const c_fuel = aeronave.consumo_kg_km * dist * 1.08 * 0.72;
                const c_leas = (aeronave.leasing_usd_hora / 1.09) * (dist / 840);
                const c_tns = terminalFees[ruta.destinoIATA]; // Tasa del aeropuerto de destino

                const ct = c_fuel + c_tns + c_enr + c_leas;
                const precio = 40 + (0.11 * dist);

                rutasCalculadas.push({
                    origin: ruta.origenIATA,
                    destination: ruta.destinoIATA,
                    // Redondeamos a 2 decimales para mantener limpieza (RNF-09)
                    distanceKm: Number(dist.toFixed(2)),
                    flightTimeHours: Number(ruta.tiempoHoras.toFixed(2)),
                    costTotalEUR: Number(ct.toFixed(2)),
                    ticketPriceEUR: Number(precio.toFixed(2))
                });
            });

            // 5. Armar el Contrato JSON exacto (Input para stdin de C++)
            const engineContract = {
                originIATA: origenIATA,
                maxFlightHours: maxFlightHours,
                aircraft: {
                    model: aeronave.modelo,
                    maxCapacity: aeronave.capacidad_max,
                    minThreshold: aeronave.umbral_min,
                    mu: aeronave.mu_demanda,
                    sigma: aeronave.sigma_demanda
                },
                routes: rutasCalculadas
            };

            return engineContract;

        } catch (error) {
            console.error('[Error en CostService]:', error.message);
            throw error;
        }
    }
}

module.exports = new CostService();