// backend/engine/motorBridge.js
//
// Capa engine: unico punto de contacto entre Node.js y el motor C++.
// Lanza el ejecutable compilado y se comunica EXCLUSIVAMENTE por stdin/stdout
// en JSON (RNF-05). No contiene logica de negocio; solo transporte.
const { execFile } = require('child_process');
const path = require('path');

// Ruta al binario. En Windows el ejecutable es motor.exe; en Linux/Mac, motor.
const BINARIO = path.join(
    __dirname,
    '../../motor/build',
    process.platform === 'win32' ? 'motor.exe' : 'motor'
);

const TIMEOUT_MS = 10000;

class MotorBridge {
    // Recibe el contrato (objeto JS), lo inyecta por stdin y resuelve con el
    // JSON de resultado del motor.
    ejecutar(contrato) {
        return new Promise((resolve, reject) => {
            const proceso = execFile(
                BINARIO,
                { timeout: TIMEOUT_MS, maxBuffer: 1024 * 1024 * 16 },
                (error, stdout, stderr) => {
                    if (error && error.killed) {
                        return reject(new Error(`El motor excedio el timeout de ${TIMEOUT_MS} ms.`));
                    }
                    if (error && !stdout) {
                        return reject(new Error(`Fallo al ejecutar el motor: ${stderr || error.message}`));
                    }
                    try {
                        resolve(JSON.parse(stdout));
                    } catch (e) {
                        reject(new Error(`Salida del motor no es JSON valido: ${e.message}`));
                    }
                }
            );

            proceso.stdin.write(JSON.stringify(contrato));
            proceso.stdin.end();
        });
    }
}

module.exports = new MotorBridge();