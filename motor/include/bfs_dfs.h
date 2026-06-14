#ifndef BFS_DFS_H
#define BFS_DFS_H

#include "grafo.h"
#include <vector>
#include <string>
#include <set>

class Busqueda {
public:
    // BFS: Valida conectividad de la red
    static std::vector<std::string> realizarBFS(const GrafoRutas& grafo, const std::string& origen);

    // DFS: Busca camino respetando tiempo maximo de jornada (8 horas)
    static bool realizarDFS(const GrafoRutas& grafo, const std::string& actual, const std::string& destino, 
                            double tiempoRestante, std::vector<std::string>& camino, std::set<std::string>& visitados);
};

#endif