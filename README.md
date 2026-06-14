# EuroSky Connect - Flight Route Optimization System

Sistema de optimización de rutas aéreas desarrollado para el curso de **Análisis y Diseño de Algoritmos (ADA)**. Este proyecto implementa una arquitectura híbrida que combina un **Backend en Node.js** para la gestión de datos y lógica de negocio, con un **Motor de Cálculo en C++** de alto rendimiento para la ejecución de algoritmos de grafos.

---

## 🏗️ Arquitectura del Proyecto

El sistema utiliza comunicación mediante **tuberías (pipes)** donde el backend genera un contrato JSON que es procesado por el motor en tiempo real.

```text
eurosky-connect/
├── backend/
│   ├── scripts/
│   │   └── generateInput.js    # Generador de contratos JSON (Input para el motor)
│   └── services/
│       └── costService.js      # Lógica de costos y rentabilidad (financiera)
├── motor/
│   ├── include/                # Cabeceras (.h) de los algoritmos
│   ├── src/                    # Implementación lógica (.cpp)
│   └── build/                  # Ejecutable compilado (.exe)
└── README.md
```

---

## 🧠 Lógica y Algoritmos

El motor en C++ implementa cuatro componentes clave para el análisis de rutas:

### Simulación Monte Carlo (`monte_carlo.cpp`)
Filtra rutas basándose en la demanda estocástica antes de la ejecución. Solo las rutas estadísticamente rentables ingresan al grafo.

### BFS - Búsqueda en Anchura (`bfs_dfs.cpp`)
Valida la conectividad de la red. Asegura que el grafo esté íntegro y que los aeropuertos sean alcanzables.

### DFS - Búsqueda en Profundidad (`bfs_dfs.cpp`)
Aplica la poda de rutas bajo restricción temporal. Verifica si existe al menos un camino que no supere las **8 horas operativas**.

### Dijkstra (`dijkstra.cpp`)
Encuentra la ruta óptima de menor costo operativo respetando la restricción máxima de tiempo establecida.

---

## 🚀 Cómo ejecutar el sistema

### 1. Compilación

Si realizas cambios en el código C++, recompila el motor desde la raíz del proyecto utilizando:

```bash
g++ -I motor/include motor/src/main.cpp motor/src/grafo.cpp motor/src/dijkstra.cpp motor/src/bfs_dfs.cpp motor/src/monte_carlo.cpp -o motor/build/motor.exe
```

### 2. Ejecución

Para procesar un contrato JSON y obtener el informe técnico:

```bash
node backend/scripts/generateInput.js | motor/build/motor.exe
```

---

## 📊 Formato de Salida (Evidencias)

El sistema genera un objeto JSON consolidado con los resultados del análisis:

```json
{
  "origen": "LHR",
  "destino": "CDG",
  "red_conectada": true,
  "dfs_viabilidad": {
    "posible": true,
    "ruta": ["LHR", "CDG"]
  },
  "dijkstra_optimo": {
    "ruta": ["LHR", "CDG"],
    "costo_total_eur": 2787.49,
    "tiempo_total_horas": 5.3,
    "ruta_valida": true
  },
  "limite_tiempo": 8.0
}
```

### Campos principales

| Campo | Descripción |
|---------|-------------|
| `origen` | Aeropuerto de partida |
| `destino` | Aeropuerto de llegada |
| `red_conectada` | Resultado de la validación BFS |
| `dfs_viabilidad` | Resultado de la búsqueda DFS bajo restricción temporal |
| `dijkstra_optimo` | Ruta óptima calculada por Dijkstra |
| `limite_tiempo` | Tiempo máximo permitido para una ruta |

---

## 🛠️ Notas de Desarrollo

### Gestión de Datos
No se utiliza una base de datos SQL en esta etapa. Los contratos JSON funcionan como mecanismo de intercambio de información entre el backend y el motor de cálculo.

### Restricción Temporal
El sistema aplica una restricción estricta de **8 horas de vuelo**. Si ninguna ruta cumple este criterio, el motor devolverá:

```json
{
  "ruta_valida": false
}
```

### Personalización de Costos
Para modificar las variables financieras y de rentabilidad, actualizar:

```text
backend/services/costService.js
```

### Contribuciones
Las mejoras relacionadas con algoritmos deben implementarse dentro del directorio:

```text
motor/src/
```

Manteniendo la separación entre la lógica de negocio (Node.js) y el motor de optimización (C++).

---

## 📚 Tecnologías Utilizadas

- Node.js
- JavaScript
- C++
- Algoritmos de Grafos
  - BFS
  - DFS
  - Dijkstra
- Simulación Monte Carlo
- JSON
- Comunicación mediante Pipes

---

## 🎯 Objetivo Académico

Este proyecto busca demostrar la aplicación práctica de algoritmos de grafos y técnicas de simulación para resolver problemas de optimización de rutas aéreas, integrando conceptos de análisis algorítmico, complejidad computacional y diseño de sistemas híbridos.