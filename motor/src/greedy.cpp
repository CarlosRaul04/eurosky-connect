// motor/src/greedy.cpp
#include "greedy.h"
#include <unordered_set>
#include <limits>

namespace {

const Arista* buscarArista(const GrafoRutas& grafo, const std::string& u, const std::string& v) {
    for (const auto& a : grafo.vecinos(u)) if (a.destino == v) return &a;
    return nullptr;
}

double tiempoRetorno(const MatrizPesos& m, const std::string& desde, const std::string& origen) {
    if (desde == origen) return 0.0;
    auto itU = m.find(desde);
    if (itU == m.end()) return std::numeric_limits<double>::infinity();
    auto itV = itU->second.find(origen);
    if (itV == itU->second.end()) return std::numeric_limits<double>::infinity();
    return itV->second;
}

} // namespace

Itinerario Greedy::construirItinerario(const GrafoRutas& grafo,
                                       const std::string& origen,
                                       double maxJornadaH,
                                       double escalaH,
                                       const MatrizPesos& tiempoMin) {
    Itinerario it;
    it.ruta.push_back(origen);

    std::unordered_set<std::string> visitados{origen};
    std::string actual = origen;
    double sumaVuelosH = 0.0;
    long pasos = 0;

    while (true) {
        ++pasos;
        const Arista* mejor = nullptr;

        // Elegir la arista de mayor beneficio que deje un retorno factible.
        for (const auto& arista : grafo.vecinos(actual)) {
            if (arista.destino == origen || visitados.count(arista.destino)) continue;

            std::size_t numTramos = it.tramos.size() + 1;
            double vuelosTrasIr = sumaVuelosH + arista.tiempoVueloH;
            double jornadaSiCierra = tiempoJornada(
                vuelosTrasIr + tiempoRetorno(tiempoMin, arista.destino, origen),
                numTramos + 1, escalaH);

            if (jornadaSiCierra > maxJornadaH) continue;
            if (!mejor || arista.beneficioEUR > mejor->beneficioEUR) mejor = &arista;
        }

        if (!mejor) break; // no hay extension factible: cerramos el ciclo

        it.ruta.push_back(mejor->destino);
        it.tramos.push_back({actual, mejor->destino, mejor->tiempoVueloH,
                             mejor->costoEUR, mejor->beneficioEUR, mejor->paxSimulados});
        visitados.insert(mejor->destino);
        sumaVuelosH        += mejor->tiempoVueloH;
        it.costoTotalEUR    += mejor->costoEUR;
        it.beneficioTotalEUR += mejor->beneficioEUR;
        actual = mejor->destino;
    }

    // Cierre del ciclo: actual -> origen.
    const Arista* cierre = buscarArista(grafo, actual, origen);
    if (actual != origen && cierre) {
        it.ruta.push_back(origen);
        it.tramos.push_back({actual, origen, cierre->tiempoVueloH,
                             cierre->costoEUR, cierre->beneficioEUR, cierre->paxSimulados});
        sumaVuelosH        += cierre->tiempoVueloH;
        it.costoTotalEUR    += cierre->costoEUR;
        it.beneficioTotalEUR += cierre->beneficioEUR;
        it.tiempoJornadaH = tiempoJornada(sumaVuelosH, it.tramos.size(), escalaH);
        it.valido = (it.tiempoJornadaH <= maxJornadaH) && (it.tramos.size() >= 2);
    } else {
        it.valido = false;
    }

    it.nodosExplorados = pasos;
    return it;
}