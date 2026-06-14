// motor/include/dijkstra.h
#ifndef DIJKSTRA_H
#define DIJKSTRA_H

#include "grafo.h"
#include <string>
#include <vector>

// Estructura para devolver los resultados del algoritmo
struct ResultadoDijkstra {
    std::vector<std::string> ruta;
    double costoTotal;
    double tiempoTotal;
};

class Dijkstra {
public:
    // Encuentra la ruta más barata desde un origen hasta un destino
    static ResultadoDijkstra calcularRutaMasBarata(const GrafoRutas& grafo, const std::string& origen, const std::string& destino);
};

#endif