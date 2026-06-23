// motor/src/bfs_dfs.h
//
// Recorridos en grafos. Complejidad base O(V + E).
//   - BFS: verifica la conectividad de la red factible desde el origen y
//          reporta los aeropuertos alcanzables (validacion previa, RF-09).
//   - DFS con backtracking: enumera TODOS los itinerarios validos en ciclo
//          cerrado (<= 8 h, sin repetir intermedios) y devuelve el de mayor
//          beneficio neto. Es el optimo exacto contra el que se compara Greedy.
#ifndef BFS_DFS_H
#define BFS_DFS_H

#include "grafo.h"
#include "itinerario.h"
#include <string>
#include <vector>

struct ResultadoBFS {
    std::vector<std::string> alcanzables; // en orden de visita por niveles
    bool todosAlcanzables;                // ¿se llega a todos los nodos del grafo?
    bool origenAislado;                   // ¿el origen no tiene aristas factibles?
};

class Busqueda {
public:
    // BFS por niveles desde el origen sobre el grafo factible.
    static ResultadoBFS bfsConectividad(const GrafoRutas& grafo, const std::string& origen);

    // DFS exacto: mejor ciclo cerrado por beneficio neto dentro de la jornada.
    // 'retornoMinTiempo' es la matriz all-pairs de tiempo minimo (Floyd-Warshall)
    // usada para podar ramas que ya no pueden volver al origen a tiempo.
    static Itinerario dfsItinerarioOptimo(
        const GrafoRutas& grafo,
        const std::string& origen,
        double maxJornadaH,
        double escalaH,
        const std::unordered_map<std::string, std::unordered_map<std::string, double>>& retornoMinTiempo);
};

#endif // BFS_DFS_H