// motor/src/dijkstra.cpp
#include "dijkstra.h"
#include <queue>
#include <limits>
#include <algorithm>

namespace {
struct NodoCola {
    std::string id;
    double costo;
    bool operator>(const NodoCola& otro) const { return costo > otro.costo; }
};
} // namespace

std::unordered_map<std::string, CaminoMinimo>
Dijkstra::costosMinimosDesde(const GrafoRutas& grafo, const std::string& origen) {
    const double INF = std::numeric_limits<double>::infinity();

    std::unordered_map<std::string, double> dist, tiempo;
    std::unordered_map<std::string, std::string> previo;

    for (const auto& iata : grafo.nodos()) dist[iata] = INF;
    dist[origen]   = 0.0;
    tiempo[origen] = 0.0;

    std::priority_queue<NodoCola, std::vector<NodoCola>, std::greater<NodoCola>> pq;
    pq.push({origen, 0.0});

    while (!pq.empty()) {
        NodoCola actual = pq.top();
        pq.pop();
        if (actual.costo > dist[actual.id]) continue; // entrada obsoleta

        for (const auto& arista : grafo.vecinos(actual.id)) {
            double nuevoCosto = dist[actual.id] + arista.costoEUR;
            if (nuevoCosto < dist[arista.destino]) {
                dist[arista.destino]   = nuevoCosto;
                tiempo[arista.destino] = tiempo[actual.id] + arista.tiempoVueloH;
                previo[arista.destino] = actual.id;
                pq.push({arista.destino, nuevoCosto});
            }
        }
    }

    std::unordered_map<std::string, CaminoMinimo> resultado;
    for (const auto& [iata, d] : dist) {
        CaminoMinimo cm;
        cm.alcanzable = (d != INF);
        cm.costoEUR   = d;
        cm.tiempoVueloH = cm.alcanzable ? tiempo[iata] : INF;
        if (cm.alcanzable) {
            for (std::string n = iata; ; n = previo[n]) {
                cm.ruta.push_back(n);
                if (n == origen) break;
                if (previo.find(n) == previo.end()) break;
            }
            std::reverse(cm.ruta.begin(), cm.ruta.end());
        }
        resultado[iata] = std::move(cm);
    }
    return resultado;
}