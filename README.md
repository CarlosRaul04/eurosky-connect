# EuroSky Connect — Optimizador de itinerarios aéreos

Sistema en tres capas que determina el **itinerario diario óptimo** (ciclo cerrado, ≤ 8 h)
de una aeronave en una red de aeropuertos europeos, maximizando el beneficio neto.

- **Frontend** (pendiente): HTML5 + Bootstrap 5 + Maps JavaScript API.
- **Backend**: Node.js + Express. Flujo `routes → controllers → services → engine`.
- **Motor**: C++17. Implementa los algoritmos. Se comunica solo por `stdin/stdout` en JSON.

## Estructura

```
eurosky-connect/
├── backend/
│   ├── app.js                       # servidor Express (monta routers + errorHandler)
│   ├── config/                      # googleMaps.js, oauth.js
│   ├── routes/                      # airport, aircraft, route(optimizacion), maps, report, auth
│   ├── controllers/                 # un controlador por recurso
│   ├── services/                    # reglas de negocio (CRUD, costos, optimizacion, reportes, auth)
│   ├── repositories/                # acceso a JSON (jsonStore + uno por coleccion)
│   ├── validators/                  # validacion de aeropuertos y aeronaves
│   ├── middlewares/                 # errorHandler, authMiddleware
│   ├── engine/motorBridge.js        # invoca el motor C++ (execFile + stdin/stdout)
│   ├── utils/AppError.js
│   ├── scripts/                     # generateInput.js, refreshRoutes.js
│   └── data/                        # airports.json, aircraft.json, routes.json, result.json
└── motor/
    ├── src/  include/  build/  Makefile
```

## Capas y dependencias (sin ciclos)

```
routes → controllers → services → repositories → data(JSON)
                           │
                           └→ engine(motorBridge) → motor C++
```

## API REST

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/status` | Salud del orquestador |
| GET/POST/PUT/DELETE | `/api/aeropuertos[/:iata]` | CRUD de aeropuertos |
| GET/POST/PUT/DELETE | `/api/aeronaves[/:modelo]` | CRUD de aeronaves (la flota) |
| POST | `/api/mapas/refresh` | Recalcula la matriz de distancias (`routes.json`) |
| POST | `/api/optimizacion` | Optimiza la jornada · body `{aeronave?, origen, seed?}` |
| GET | `/api/reportes/comparativa` | Tabla comparativa de algoritmos |
| GET | `/api/reportes/itinerario.csv` | Itinerario óptimo en CSV (RF-16) |
| GET | `/api/auth/login` · `/callback` · `/me` · `/logout` | Google OAuth 2.0 (RF-18) |

> Tras crear/editar/eliminar aeropuertos hay que llamar a `/api/mapas/refresh`
> para recalcular las distancias.

## Pipeline del motor

1. **Monte Carlo** — simula demanda diaria, calcula `b(u,v)` y construye el grafo factible.
2. **BFS** `O(V+E)` — valida conectividad desde el origen.
3. **Floyd-Warshall** `O(V³)` — costos y tiempos mínimos all-pairs (referencia + poda).
4. **Dijkstra** `O((V+E) log V)` — costo mínimo desde el origen.
5. **DFS + backtracking** — ciclo cerrado de **máximo beneficio** (óptimo exacto).
6. **Greedy** — heurística para comparar contra el óptimo.

## Puesta en marcha

```bash
npm install
make -C motor            # compila motor/build/motor
npm run maps:refresh     # genera routes.json (offline si no hay API key)
npm run engine:demo      # demo por consola
npm start                # API REST en :3000
```

## Notas de modelado

- **Tiempo de vuelo = `distancia / 840 km/h`**, nunca el tiempo de conducción.
  La distancia es geográfica (círculo máximo / Routes API).
- `C_leas = (leasing_usd_hora / 1.09) × tiempo_vuelo`.
- Persistencia solo en JSON; sin base de datos (RR-06).
- Claves (Maps / OAuth) en `.env` (ver `.env.example`), nunca en el repositorio.
- OAuth se activa solo si hay credenciales; en su ausencia, las rutas protegidas quedan abiertas (modo prototipo).
