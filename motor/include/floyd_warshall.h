// motor/src/floyd_warshall.h
//
// Caminos minimos entre todos los pares de aeropuertos (programacion dinamica).
// Complejidad temporal: O(V^3).  Complejidad espacial: O(V^2).
//
// Se computan dos matrices:
//   - costo : CT minimo entre cada par (RF-11, referencia y comparativa).
//   - tiempo: tiempo de vuelo minimo entre cada par (alimenta la poda del DFS:
//             "¿puedo volver al origen a tiempo desde aqui?").
#ifndef FLOYD_WARSHALL_H
#define FLOYD_WARSHALL_H

#include "grafo.h"
#include <string>
#include <unordered_map>

using MatrizPesos = std::unordered_map<std::string, std::unordered_map<std::string, double>>;

struct ResultadoFloyd {
    MatrizPesos costo;
    MatrizPesos tiempo;
};

class FloydWarshall {
public:
    static ResultadoFloyd calcular(const GrafoRutas& grafo);
};

#endif // FLOYD_WARSHALL_H