#ifndef DIJKSTRA_H
#define DIJKSTRA_H

#include "grafo.h"
#include <vector>
#include <string>

/**
 * Estructura que almacena el resultado del calculo de la ruta optima.
 */
struct ResultadoDijkstra {
    std::vector<std::string> ruta;
    double costoTotal;
    double tiempoTotal;
    bool rutaValida;
};

class Dijkstra {
public:
    /**
     * Calcula la ruta mas economica desde un origen a un destino, 
     * aplicando penalizaciones por rentabilidad y poda por restriccion de tiempo.
     */
    static ResultadoDijkstra calcularRutaMasBarata(const GrafoRutas& grafo, 
                                                   const std::string& origen, 
                                                   const std::string& destino, 
                                                   double tiempoMaximo);
};

#endif