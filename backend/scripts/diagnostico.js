// scripts/diagnostico.js
// Ejecuta: node scripts/diagnostico.js
// Verifica que el servidor esta corriendo y todos los endpoints responden.
// Levanta el servidor, prueba todos los endpoints criticos y lo cierra.

const http = require('http');

const BASE = 'http://localhost:3000';

function get(path) {
    return new Promise((resolve, reject) => {
        http.get(`${BASE}${path}`, (res) => {
            let body = '';
            res.on('data', (d) => (body += d));
            res.on('end', () => {
                try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
                catch { resolve({ status: res.statusCode, data: body.slice(0, 80) }); }
            });
        }).on('error', reject);
    });
}

function post(path, payload) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify(payload);
        const opts = {
            hostname: 'localhost', port: 3000, path, method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
        };
        const req = http.request(opts, (res) => {
            let data = '';
            res.on('data', (d) => (data += d));
            res.on('end', () => {
                try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
                catch { resolve({ status: res.statusCode, data: data.slice(0, 80) }); }
            });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

function ok(label, status, esperado = 200) {
    const pass = status === esperado;
    console.log(`  [${pass ? 'OK' : 'FAIL'}] ${label} -> HTTP ${status}`);
    return pass;
}

async function main() {
    console.log('\n====== EuroSky Connect - Diagnostico de API ======');
    console.log(`Servidor objetivo: ${BASE}\n`);

    let errores = 0;

    try {
        // Status
        const st = await get('/api/status');
        if (!ok('GET /api/status', st.status)) errores++;
        else console.log(`       auth: ${st.data.auth}`);

        // Aeropuertos
        const ap = await get('/api/aeropuertos');
        if (!ok('GET /api/aeropuertos', ap.status)) errores++;
        else console.log(`       ${ap.data.length} aeropuertos registrados`);

        const apOne = await get('/api/aeropuertos/FRA');
        if (!ok('GET /api/aeropuertos/FRA', apOne.status)) errores++;

        const apBad = await get('/api/aeropuertos/XXXX');
        if (!ok('GET /api/aeropuertos/XXXX (debe ser 404)', apBad.status, 404)) errores++;

        // Aeronaves
        const ac = await get('/api/aeronaves');
        if (!ok('GET /api/aeronaves', ac.status)) errores++;
        else console.log(`       ${ac.data.length} aeronaves en flota: ${ac.data.map((a) => a.modelo).join(', ')}`);

        // Reportes (pueden ser 404 si aun no hay resultado)
        const comp = await get('/api/reportes/comparativa');
        if (comp.status === 404) {
            console.log('  [SKIP] GET /api/reportes/comparativa -> aun no hay resultado (normal si no se optimizo)');
        } else if (!ok('GET /api/reportes/comparativa', comp.status)) {
            errores++;
        }

        // Optimizacion
        console.log('\n  Ejecutando optimizacion (puede tardar 1-3 segundos)...');
        const opt = await post('/api/optimizacion', { aeronave: 'Airbus A320neo', origen: 'FRA', seed: 42 });
        if (!ok('POST /api/optimizacion', opt.status)) {
            errores++;
            console.log('       Error:', JSON.stringify(opt.data).slice(0, 120));
        } else {
            const d = opt.data;
            const dfs = d.itineraries && d.itineraries.dfsExact;
            console.log(`       status: ${d.status}`);
            if (dfs) {
                console.log(`       DFS optimo: ${dfs.ruta.join(' -> ')}`);
                console.log(`       Beneficio: ${Math.round(dfs.beneficioTotalEUR)} EUR | Jornada: ${dfs.tiempoJornadaH.toFixed(2)} h`);
                console.log(`       Monte Carlo: ${d.demandSimulation.feasibleEdges} factibles, ${d.demandSimulation.discardedEdges} descartadas`);
            }
        }

        // Reporte CSV (ahora que ya hay resultado)
        const csv = await get('/api/reportes/itinerario.csv');
        if (!ok('GET /api/reportes/itinerario.csv', csv.status)) errores++;
        else console.log(`       CSV generado (${String(csv.data).split('\n').length} filas)`);

        const comp2 = await get('/api/reportes/comparativa');
        if (!ok('GET /api/reportes/comparativa', comp2.status)) errores++;
        else comp2.data.forEach((c) =>
            console.log(`       ${c.algoritmo}: ${Math.round(c.beneficioTotalEUR)} EUR`)
        );

    } catch (e) {
        console.log('\n  [ERROR CRITICO] No se pudo conectar al servidor.');
        console.log('  Asegurate de que "npm start" este corriendo en otra terminal.');
        console.log('  Detalle:', e.message);
        process.exit(1);
    }

    console.log(`\n====== ${errores === 0 ? 'TODOS LOS TESTS PASARON' : `${errores} FALLO(S)`} ======\n`);
    process.exit(errores > 0 ? 1 : 0);
}

main();