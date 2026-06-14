// backend/testCost.js
const costService = require('../services/costService');

console.log('[Prueba] Generando contrato JSON para el motor C++...');

try {
    // Simulamos que el usuario eligió el Airbus A320neo y quiere salir de Londres (LHR)
    const contrato = costService.buildEngineContract("Airbus A320neo", "LHR");

    console.log('\n======================================================');
    console.log('✈️  CONTRATO JSON GENERADO CON ÉXITO (Muestra parcial)');
    console.log('======================================================\n');
    
    // Imprimimos la cabecera y solo las primeras 2 rutas para no saturar la consola
    const muestra = {
        ...contrato,
        routes: [contrato.routes[0], contrato.routes[1], "... (208 rutas más)"]
    };

    console.log(JSON.stringify(muestra, null, 2));
    console.log('\n[Acción] Este es el JSON exacto que se inyectará por stdin a C++.');

} catch (error) {
    console.error('Falló la prueba:', error.message);
}