// backend/repositories/jsonStore.js
//
// Acceso de bajo nivel a la persistencia JSON. Es el UNICO modulo que toca el
// sistema de archivos para datos; el resto del backend depende de los
// repositorios, no de fs. Centralizarlo evita duplicacion y facilita cambiar
// el almacenamiento mas adelante (alta cohesion, bajo acoplamiento).
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');

function resolve(fileName) {
    return path.join(DATA_DIR, fileName);
}

function read(fileName) {
    const ruta = resolve(fileName);
    if (!fs.existsSync(ruta)) return null;
    return JSON.parse(fs.readFileSync(ruta, 'utf8'));
}

// Escritura atomica: se escribe en un temporal y luego se renombra, para no
// dejar el archivo a medias si el proceso se interrumpe.
function write(fileName, data) {
    const ruta = resolve(fileName);
    const tmp = `${ruta}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, ruta);
    return data;
}

module.exports = { read, write };