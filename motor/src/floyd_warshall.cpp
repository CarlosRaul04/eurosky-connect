// motor/src/floyd_warshall.cpp
#include "floyd_warshall.h"
#include <limits>

ResultadoFloyd FloydWarshall::calcular(const GrafoRutas& grafo) {
    const double INF = std::numeric_limits<double>::infinity();
    std::vector<std::string> V = grafo.nodos();

    ResultadoFloyd r;
    // Inicializacion: diagonal 0, resto INF.
    for (const auto& i : V) {
        for (const auto& j : V) {
            r.costo[i][j]  = (i == j) ? 0.0 : INF;
            r.tiempo[i][j] = (i == j) ? 0.0 : INF;
        }
    }
    // Aristas directas (se queda con la de menor peso si hubiera paralelas).
    for (const auto& u : V) {
        for (const auto& a : grafo.vecinos(u)) {
            if (a.costoEUR     < r.costo[u][a.destino])  r.costo[u][a.destino]  = a.costoEUR;
            if (a.tiempoVueloH < r.tiempo[u][a.destino]) r.tiempo[u][a.destino] = a.tiempoVueloH;
        }
    }
    // Relajacion por nodo intermedio k. O(V^3).
    for (const auto& k : V) {
        for (const auto& i : V) {
            for (const auto& j : V) {
                if (r.costo[i][k] + r.costo[k][j] < r.costo[i][j])
                    r.costo[i][j] = r.costo[i][k] + r.costo[k][j];
                if (r.tiempo[i][k] + r.tiempo[k][j] < r.tiempo[i][j])
                    r.tiempo[i][j] = r.tiempo[i][k] + r.tiempo[k][j];
            }
        }
    }
    return r;
}