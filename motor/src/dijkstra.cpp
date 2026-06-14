// motor/src/dijkstra.cpp
#include "dijkstra.h"
#include <queue>
#include <limits>
#include <algorithm>
#include <unordered_map>

// Estructura auxiliar para el Min-Heap (Cola de prioridad)
struct NodoCola {
    std::string id;
    double costoAcumulado;
    
    // Sobrecarga del operador para que la cola ordene de menor a mayor costo
    bool operator>(const NodoCola& otro) const {
        return costoAcumulado > otro.costoAcumulado;
    }
};

ResultadoDijkstra Dijkstra::calcularRutaMasBarata(const GrafoRutas& grafo, const std::string& origen, const std::string& destino) {
    auto adjList = grafo.obtenerAdyacencia();

    std::unordered_map<std::string, double> distancias;
    std::unordered_map<std::string, std::string> predecesores;
    std::unordered_map<std::string, double> tiemposAcumulados;

    // Inicializar distancias al infinito
    for (const auto& par : adjList) {
        distancias[par.first] = std::numeric_limits<double>::infinity();
    }
    
    distancias[origen] = 0.0;
    tiemposAcumulados[origen] = 0.0;

    // Priority Queue (Min-Heap) requerida en RF-10
    std::priority_queue<NodoCola, std::vector<NodoCola>, std::greater<NodoCola>> pq;
    pq.push({origen, 0.0});

    while (!pq.empty()) {
        auto actual = pq.top();
        pq.pop();

        std::string u = actual.id;

        // Optimización: Si ya llegamos al destino, no procesamos más
        if (u == destino) break;
        if (actual.costoAcumulado > distancias[u]) continue;

        // Explorar vecinos
        for (const auto& arista : adjList.at(u)) {
            std::string v = arista.destino;
            double peso = arista.costoTotalEUR; // Evaluamos por COSTO OPERATIVO

            // Relajación de la arista
            if (distancias[u] + peso < distancias[v]) {
                distancias[v] = distancias[u] + peso;
                predecesores[v] = u;
                tiemposAcumulados[v] = tiemposAcumulados[u] + arista.tiempoHoras;
                pq.push({v, distancias[v]});
            }
        }
    }

    // Reconstruir el camino desde el destino hacia el origen
    ResultadoDijkstra res;
    res.costoTotal = distancias[destino];
    res.tiempoTotal = tiemposAcumulados[destino];

    std::string nodoActual = destino;
    while (nodoActual != "") {
        res.ruta.push_back(nodoActual);
        if (predecesores.find(nodoActual) != predecesores.end()) {
            nodoActual = predecesores[nodoActual];
        } else {
            break;
        }
    }
    
    // Invertir para que la ruta sea de Origen -> Destino
    std::reverse(res.ruta.begin(), res.ruta.end());
    return res;
}