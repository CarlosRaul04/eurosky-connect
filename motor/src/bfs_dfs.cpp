// motor/src/bfs_dfs.cpp
#include "bfs_dfs.h"
#include <queue>
#include <unordered_set>
#include <limits>

// ---------------------------------------------------------------------------
// BFS: conectividad de la red factible. Complejidad O(V + E).
// ---------------------------------------------------------------------------
ResultadoBFS Busqueda::bfsConectividad(const GrafoRutas& grafo, const std::string& origen) {
    ResultadoBFS r;
    std::unordered_set<std::string> visitados;
    std::queue<std::string> cola;

    cola.push(origen);
    visitados.insert(origen);

    while (!cola.empty()) {
        std::string u = cola.front();
        cola.pop();
        r.alcanzables.push_back(u);
        for (const auto& arista : grafo.vecinos(u)) {
            if (visitados.insert(arista.destino).second) {
                cola.push(arista.destino);
            }
        }
    }

    r.todosAlcanzables = (visitados.size() == grafo.numNodos());
    r.origenAislado    = grafo.vecinos(origen).empty();
    return r;
}

// ---------------------------------------------------------------------------
// DFS con backtracking: mejor ciclo cerrado por beneficio neto.
//
// Espacio de busqueda: permutaciones de aeropuertos alcanzables desde el
// origen, acotado por la jornada de 8 h. Con la poda por tiempo de retorno
// (Floyd-Warshall) el arbol explorado es pequeño para 15 nodos.
//
// Complejidad: O(V!) en el peor caso teorico, pero la cota de jornada limita
// la profundidad a unos pocos tramos, por lo que en la practica es << 1 s.
// ---------------------------------------------------------------------------
namespace {

struct EstadoDFS {
    const GrafoRutas& grafo;
    const std::string& origen;
    double maxJornadaH;
    double escalaH;
    const std::unordered_map<std::string, std::unordered_map<std::string, double>>& retornoMin;

    std::vector<std::string> rutaActual;
    std::vector<Tramo>       tramosActual;
    std::unordered_set<std::string> visitados;
    double sumaVuelosH = 0.0;
    double sumaCosto   = 0.0;
    double sumaBenef   = 0.0;
    long   nodosExplorados = 0;

    Itinerario mejor; // mejor solucion encontrada

    EstadoDFS(const GrafoRutas& g, const std::string& o, double maxJ, double esc,
              const std::unordered_map<std::string, std::unordered_map<std::string, double>>& ret)
        : grafo(g), origen(o), maxJornadaH(maxJ), escalaH(esc), retornoMin(ret) {}
};

// ¿Existe arista factible u -> v? Devuelve puntero a la arista o nullptr.
const Arista* buscarArista(const GrafoRutas& grafo, const std::string& u, const std::string& v) {
    for (const auto& a : grafo.vecinos(u)) {
        if (a.destino == v) return &a;
    }
    return nullptr;
}

// Tiempo minimo para volver al origen desde 'nodo' (0 si ya es el origen).
double tiempoRetornoMin(const EstadoDFS& s, const std::string& nodo) {
    if (nodo == s.origen) return 0.0;
    auto itU = s.retornoMin.find(nodo);
    if (itU == s.retornoMin.end()) return std::numeric_limits<double>::infinity();
    auto itV = itU->second.find(s.origen);
    if (itV == itU->second.end()) return std::numeric_limits<double>::infinity();
    return itV->second;
}

void explorar(EstadoDFS& s, const std::string& actual) {
    ++s.nodosExplorados;

    // Intento de cierre: si hay arista actual -> origen y el ciclo cabe en la
    // jornada, evaluamos este itinerario como candidato.
    if (actual != s.origen) {
        if (const Arista* cierre = buscarArista(s.grafo, actual, s.origen)) {
            std::size_t numTramos = s.tramosActual.size() + 1;
            double jornada = tiempoJornada(s.sumaVuelosH + cierre->tiempoVueloH, numTramos, s.escalaH);
            if (jornada <= s.maxJornadaH) {
                double benef = s.sumaBenef + cierre->beneficioEUR;
                if (!s.mejor.valido || benef > s.mejor.beneficioTotalEUR) {
                    Itinerario cand;
                    cand.ruta    = s.rutaActual;
                    cand.ruta.push_back(s.origen);
                    cand.tramos  = s.tramosActual;
                    cand.tramos.push_back({actual, s.origen, cierre->tiempoVueloH,
                                           cierre->costoEUR, cierre->beneficioEUR, cierre->paxSimulados});
                    cand.tiempoJornadaH    = jornada;
                    cand.costoTotalEUR     = s.sumaCosto + cierre->costoEUR;
                    cand.beneficioTotalEUR = benef;
                    cand.valido            = true;
                    s.mejor = cand;
                }
            }
        }
    }

    // Expansion: probar cada vecino factible no visitado.
    for (const auto& arista : s.grafo.vecinos(actual)) {
        const std::string& v = arista.destino;
        if (v == s.origen || s.visitados.count(v)) continue;

        std::size_t numTramosTrasIr = s.tramosActual.size() + 1;
        double vuelosTrasIr = s.sumaVuelosH + arista.tiempoVueloH;

        // Poda: si tras volar a v ni el retorno mas rapido cabe en la jornada,
        // no tiene sentido continuar por esta rama.
        double jornadaMinSiCierra =
            tiempoJornada(vuelosTrasIr + tiempoRetornoMin(s, v), numTramosTrasIr + 1, s.escalaH);
        if (jornadaMinSiCierra > s.maxJornadaH) continue;

        // Avanzar
        s.rutaActual.push_back(v);
        s.tramosActual.push_back({actual, v, arista.tiempoVueloH, arista.costoEUR,
                                  arista.beneficioEUR, arista.paxSimulados});
        s.visitados.insert(v);
        s.sumaVuelosH += arista.tiempoVueloH;
        s.sumaCosto   += arista.costoEUR;
        s.sumaBenef   += arista.beneficioEUR;

        explorar(s, v);

        // Retroceder (backtracking)
        s.rutaActual.pop_back();
        s.tramosActual.pop_back();
        s.visitados.erase(v);
        s.sumaVuelosH -= arista.tiempoVueloH;
        s.sumaCosto   -= arista.costoEUR;
        s.sumaBenef   -= arista.beneficioEUR;
    }
}

} // namespace

Itinerario Busqueda::dfsItinerarioOptimo(
    const GrafoRutas& grafo,
    const std::string& origen,
    double maxJornadaH,
    double escalaH,
    const std::unordered_map<std::string, std::unordered_map<std::string, double>>& retornoMinTiempo) {

    EstadoDFS s(grafo, origen, maxJornadaH, escalaH, retornoMinTiempo);
    s.rutaActual.push_back(origen);
    s.visitados.insert(origen);

    explorar(s, origen);

    s.mejor.nodosExplorados = s.nodosExplorados;
    return s.mejor;
}