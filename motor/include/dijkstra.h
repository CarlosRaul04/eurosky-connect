// motor/src/dijkstra.h
//
// Camino de menor costo operativo (CT) desde un origen a todos los demas
// aeropuertos del grafo factible, con cola de prioridad (min-heap).
// Complejidad temporal: O((V + E) log V).  Complejidad espacial: O(V).
#ifndef DIJKSTRA_H
#define DIJKSTRA_H

#include "grafo.h"
#include <string>
#include <vector>
#include <unordered_map>

struct CaminoMinimo {
    double costoEUR;
    double tiempoVueloH;            // tiempo acumulado del camino de menor costo
    std::vector<std::string> ruta; // origen -> ... -> destino
    bool   alcanzable;
};

class Dijkstra {
public:
    // Devuelve, por cada nodo alcanzable, su camino de menor costo desde origen.
    static std::unordered_map<std::string, CaminoMinimo>
    costosMinimosDesde(const GrafoRutas& grafo, const std::string& origen);
};

#endif // DIJKSTRA_H