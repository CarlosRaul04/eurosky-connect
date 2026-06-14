// backend/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Carga las variables de entorno (API Keys)

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares obligatorios
app.use(cors()); // Permite peticiones desde el frontend
app.use(express.json()); // Permite al servidor entender JSON en el body de las peticiones

// ==========================================
// IMPORTACIÓN DE RUTAS (Flujo RNF-02)
// ==========================================
// Aquí conectaremos nuestro router más adelante
// const optimizacionRoutes = require('./routes/optimizacionRoutes');
// app.use('/api/optimizacion', optimizacionRoutes);

// Ruta de comprobación de salud (Health check)
app.get('/api/status', (req, res) => {
    res.json({ 
        status: 'SUCCESS', 
        message: 'El orquestador de EuroSky Connect está funcionando.' 
    });
});

// Levantar el servidor
app.listen(PORT, () => {
    console.log(`[EuroSky Connect] Servidor orquestador corriendo en el puerto ${PORT}`);
    console.log(`[EuroSky Connect] Esperando peticiones en http://localhost:${PORT}`);
});