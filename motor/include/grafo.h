// motor/src/grafo.h
#ifndef GRAFO_H
#define GRAFO_H

#include <iostream>
#include <vector>
#include <string>
#include <unordered_map>

// Representa el peso múltiple de nuestra conexión
struct Arista {
    std::string destino;
    double distanciaKm;
    double tiempoHoras;
    double costoTotalEUR;
    double precioBoletoEUR;
};

class GrafoRutas {
private:
    // Lista de adyacencia: Mapa que asocia un IATA (ej. "LHR") con su lista de rutas
    std::unordered_map<std::string, std::vector<Arista>> adjList;

public:
    // Método para poblar el grafo
    void agregarArista(const std::string& origen, const std::string& destino, 
                       double dist, double tiempo, double costo, double precio);
    
    // Método de depuración para ver que se armó bien
    void mostrarGrafo() const;
    
    // Getter para que los algoritmos (Dijkstra, BFS, etc.) puedan leer el grafo luego
    const std::unordered_map<std::string, std::vector<Arista>>& obtenerAdyacencia() const;
};

#endif