#include "dijkstra.h"
#include <queue>
#include <limits>
#include <algorithm>
#include <unordered_map>

// Estructura interna para la cola de prioridad
struct NodoCola {
    std::string id;
    double costoAcumulado;
    bool operator>(const NodoCola& otro) const {
        return costoAcumulado > otro.costoAcumulado;
    }
};

ResultadoDijkstra Dijkstra::calcularRutaMasBarata(const GrafoRutas& grafo, const std::string& origen, 
                                                   const std::string& destino, double tiempoMaximo) {
    auto adjList = grafo.obtenerAdyacencia();
    std::unordered_map<std::string, double> distancias;
    std::unordered_map<std::string, std::string> predecesores;
    std::unordered_map<std::string, double> tiempos;

    // Inicializar distancias a infinito
    for (const auto& par : adjList) {
        distancias[par.first] = std::numeric_limits<double>::infinity();
    }
    
    distancias[origen] = 0.0;
    tiempos[origen] = 0.0;

    std::priority_queue<NodoCola, std::vector<NodoCola>, std::greater<NodoCola>> pq;
    pq.push({origen, 0.0});

    while (!pq.empty()) {
        auto actual = pq.top();
        pq.pop();

        std::string u = actual.id;

        if (actual.costoAcumulado > distancias[u]) continue;

        if (adjList.find(u) != adjList.end()) {
            for (const auto& arista : adjList.at(u)) {
                std::string v = arista.destino;
                
                double nuevoCosto = distancias[u] + arista.costoTotalEUR;
                double nuevoTiempo = tiempos[u] + arista.tiempoHoras;

                // Restriccion estricta: tiempo debe ser menor o igual al limite
                // Solo relajamos la arista si cumple el limite y mejora el costo
                if (nuevoTiempo <= tiempoMaximo && nuevoCosto < distancias[v]) {
                    distancias[v] = nuevoCosto;
                    tiempos[v] = nuevoTiempo;
                    predecesores[v] = u;
                    pq.push({v, nuevoCosto});
                }
            }
        }
    }

    // Reconstruccion de la ruta
    ResultadoDijkstra res;
    res.rutaValida = (distancias[destino] != std::numeric_limits<double>::infinity());
    
    if (res.rutaValida) {
        res.costoTotal = distancias[destino];
        res.tiempoTotal = tiempos[destino];
        
        std::string nodoActual = destino;
        while (nodoActual != "") {
            res.ruta.push_back(nodoActual);
            if (predecesores.find(nodoActual) != predecesores.end()) {
                nodoActual = predecesores[nodoActual];
            } else {
                break;
            }
        }
        std::reverse(res.ruta.begin(), res.ruta.end());
    }
    
    return res;
}