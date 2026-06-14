// motor/src/grafo.cpp
#include "grafo.h"

void GrafoRutas::agregarArista(const std::string& origen, const std::string& destino, 
                               double dist, double tiempo, double costo, double precio) {
    // Como el JSON (Google Maps) ya trae las 210 conexiones de ida y vuelta,
    // solo agregamos la dirección de origen a destino para tener exactamente 14 aristas por nodo.
    adjList[origen].push_back({destino, dist, tiempo, costo, precio});
}

void GrafoRutas::mostrarGrafo() const {
    std::cout << "\n=== ESTRUCTURA DEL GRAFO EN MEMORIA C++ ===" << std::endl;
    for (const auto& par : adjList) {
        std::cout << "Aeropuerto [" << par.first << "] conecta directo con:" << std::endl;
        // Mostramos solo un par de rutas por nodo para no inundar la consola
        int cont = 0;
        for (const auto& arista : par.second) {
            if (cont++ < 2) {
                std::cout << "  -> " << arista.destino 
                          << " (Dist: " << arista.distanciaKm << " km, Costo: " 
                          << arista.costoTotalEUR << " EUR)" << std::endl;
            }
        }
        std::cout << "  ... y " << (par.second.size() - 2) << " destinos mas." << std::endl;
    }
    std::cout << "===========================================\n" << std::endl;
}

const std::unordered_map<std::string, std::vector<Arista>>& GrafoRutas::obtenerAdyacencia() const {
    return adjList;
}