// frontend/js/api.js
//
// Cliente REST: unico punto del frontend que habla con el backend. El frontend
// nunca llama al motor ni a Google Maps de calculo; solo consume estos endpoints.
const API = (() => {
    const base = (window.EUROSKY_CONFIG && window.EUROSKY_CONFIG.apiBase) || '';

    async function request(path, { method = 'GET', body } = {}) {
        const opts = { method, headers: {} };
        if (body !== undefined) {
            opts.headers['Content-Type'] = 'application/json';
            opts.body = JSON.stringify(body);
        }
        const res = await fetch(`${base}${path}`, opts);
        const text = await res.text();
        const data = text ? JSON.parse(text) : null;

        if (!res.ok) {
            const msg = (data && data.error) || `Error HTTP ${res.status}`;
            const err = new Error(msg);
            err.status = res.status;
            err.payload = data; // puede traer el resultado (422) o detalles (400)
            throw err;
        }
        return data;
    }

    return {
        // Aeropuertos
        listAirports: () => request('/api/aeropuertos'),
        createAirport: (a) => request('/api/aeropuertos', { method: 'POST', body: a }),
        updateAirport: (iata, a) => request(`/api/aeropuertos/${iata}`, { method: 'PUT', body: a }),
        deleteAirport: (iata) => request(`/api/aeropuertos/${iata}`, { method: 'DELETE' }),

        // Aeronaves
        listAircraft: () => request('/api/aeronaves'),
        createAircraft: (a) => request('/api/aeronaves', { method: 'POST', body: a }),
        updateAircraft: (modelo, a) => request(`/api/aeronaves/${encodeURIComponent(modelo)}`, { method: 'PUT', body: a }),
        deleteAircraft: (modelo) => request(`/api/aeronaves/${encodeURIComponent(modelo)}`, { method: 'DELETE' }),

        // Mapas
        refreshMaps: () => request('/api/mapas/refresh', { method: 'POST' }),

        // Optimizacion
        optimize: (payload) => request('/api/optimizacion', { method: 'POST', body: payload }),

        // Reportes
        csvUrl: () => `${base}/api/reportes/itinerario.csv`,
    };
})();