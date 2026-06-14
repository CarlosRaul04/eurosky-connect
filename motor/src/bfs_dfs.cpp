#include "bfs_dfs.h"
#include <queue>

std::vector<std::string> Busqueda::realizarBFS(const GrafoRutas& grafo, const std::string& origen) {
    std::vector<std::string> ordenVisita;
    std::set<std::string> visitados;
    std::queue<std::string> cola;

    cola.push(origen);
    visitados.insert(origen);

    while (!cola.empty()) {
        std::string u = cola.front();
        cola.pop();
        ordenVisita.push_back(u);

        const auto& adj = grafo.obtenerAdyacencia();
        if (adj.find(u) != adj.end()) {
            for (const auto& arista : adj.at(u)) {
                if (visitados.find(arista.destino) == visitados.end()) {
                    visitados.insert(arista.destino);
                    cola.push(arista.destino);
                }
            }
        }
    }
    return ordenVisita;
}

bool Busqueda::realizarDFS(const GrafoRutas& grafo, const std::string& actual, const std::string& destino, 
                           double tiempoRestante, std::vector<std::string>& camino, std::set<std::string>& visitados) {
    
    visitados.insert(actual);
    camino.push_back(actual);

    if (actual == destino) {
        return true;
    }

    const auto& adj = grafo.obtenerAdyacencia();
    if (adj.find(actual) != adj.end()) {
        for (const auto& arista : adj.at(actual)) {
            // Validacion de restriccion de tiempo
            if (visitados.find(arista.destino) == visitados.end() && arista.tiempoHoras <= tiempoRestante) {
                if (realizarDFS(grafo, arista.destino, destino, tiempoRestante - arista.tiempoHoras, camino, visitados)) {
                    return true;
                }
            }
        }
    }

    camino.pop_back();
    visitados.erase(actual);
    return false;
}