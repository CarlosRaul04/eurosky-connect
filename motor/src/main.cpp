// motor/src/main.cpp
//
// Motor algoritmico de EuroSky Connect.
// E/S exclusivamente por stdin/stdout en JSON (sin APIs, sin archivos).
//
// Pipeline:
//   1. Monte Carlo  -> simula demanda y construye el grafo factible (b(u,v) > 0).
//   2. BFS          -> valida conectividad de la red factible desde el origen.
//   3. Floyd-Warshall -> all-pairs costo (referencia) y tiempo (poda del DFS).
//   4. Dijkstra     -> costo minimo CT desde el origen (referencia RF-10).
//   5. DFS exacto   -> mejor itinerario en ciclo cerrado por beneficio neto.
//   6. Greedy       -> itinerario heuristico para comparar contra el optimo.
#include <iostream>
#include <string>
#include <random>
#include <chrono>
#include "json.hpp"
#include "grafo.h"
#include "monte_carlo.h"
#include "bfs_dfs.h"
#include "dijkstra.h"
#include "floyd_warshall.h"
#include "greedy.h"

using json = nlohmann::json;
using Reloj = std::chrono::high_resolution_clock;

static double msDesde(Reloj::time_point t0) {
    return std::chrono::duration<double, std::milli>(Reloj::now() - t0).count();
}

static json itinerarioAJson(const Itinerario& it) {
    json tramos = json::array();
    for (const auto& t : it.tramos) {
        tramos.push_back({
            {"origen", t.origen}, {"destino", t.destino},
            {"tiempoVueloH", t.tiempoVueloH}, {"costoEUR", t.costoEUR},
            {"beneficioEUR", t.beneficioEUR}, {"pax", t.pax}
        });
    }
    return {
        {"valido", it.valido},
        {"ruta", it.ruta},
        {"tramos", tramos},
        {"tiempoJornadaH", it.tiempoJornadaH},
        {"costoTotalEUR", it.costoTotalEUR},
        {"beneficioTotalEUR", it.beneficioTotalEUR},
        {"nodosExplorados", it.nodosExplorados},
        {"execMs", it.execMs}
    };
}

int main() {
    try {
        json contrato;
        if (!(std::cin >> contrato)) {
            std::cout << json({{"status", "EMPTY_INPUT"}}).dump() << std::endl;
            return 0;
        }

        const std::string origen   = contrato.at("originIATA").get<std::string>();
        const double maxJornadaH    = contrato.value("maxJourneyHours", 8.0);
        const double escalaH        = contrato.value("layoverHours", 0.5);

        ParametrosAeronave aeronave;
        aeronave.mu           = contrato.at("aircraft").at("mu");
        aeronave.sigma        = contrato.at("aircraft").at("sigma");
        aeronave.umbralMin    = contrato.at("aircraft").at("minThreshold");
        aeronave.capacidadMax = contrato.at("aircraft").at("maxCapacity");

        // Semilla reproducible si se provee; aleatoria en caso contrario.
        std::mt19937 gen;
        if (contrato.contains("monteCarloSeed") && !contrato["monteCarloSeed"].is_null()) {
            gen.seed(contrato["monteCarloSeed"].get<unsigned>());
        } else {
            std::random_device rd; gen.seed(rd());
        }

        // ---- 1. Monte Carlo: construir grafo factible ----
        auto t0 = Reloj::now();
        GrafoRutas grafo;
        json edgesMC = json::array();
        int factibles = 0, descartadas = 0;

        for (const auto& ruta : contrato.at("routes")) {
            std::string u = ruta.at("origin");
            std::string v = ruta.at("destination");
            grafo.registrarNodo(u);
            grafo.registrarNodo(v);

            double precio = ruta.at("ticketPriceEUR");
            double costo  = ruta.at("costTotalEUR");
            MuestraDemanda m = MonteCarlo::simularArista(gen, aeronave, precio, costo);

            if (m.factible) {
                Arista a;
                a.destino         = v;
                a.distanciaKm     = ruta.at("distanceKm");
                a.tiempoVueloH    = ruta.at("flightTimeHours");
                a.costoEUR        = costo;
                a.precioBoletoEUR = precio;
                a.paxSimulados    = m.pax;
                a.ingresoEUR      = m.ingresoEUR;
                a.beneficioEUR    = m.beneficioEUR;
                grafo.agregarArista(u, a);
                ++factibles;
            } else {
                ++descartadas;
            }
            edgesMC.push_back({{"u", u}, {"v", v}, {"pax", m.pax},
                               {"beneficioEUR", m.beneficioEUR}, {"factible", m.factible}});
        }
        double mcMs = msDesde(t0);

        // ---- 2. BFS: conectividad ----
        t0 = Reloj::now();
        ResultadoBFS bfs = Busqueda::bfsConectividad(grafo, origen);
        double bfsMs = msDesde(t0);

        json respuesta;
        respuesta["origin"]      = origen;
        respuesta["aircraft"]    = contrato.at("aircraft").value("model", "");
        respuesta["constraints"] = {{"maxJourneyHours", maxJornadaH}, {"layoverHours", escalaH}};
        respuesta["demandSimulation"] = {
            {"feasibleEdges", factibles}, {"discardedEdges", descartadas},
            {"execMs", mcMs}, {"edges", edgesMC}
        };
        respuesta["connectivity"] = {
            {"reachableFromOrigin", bfs.alcanzables},
            {"allReachable", bfs.todosAlcanzables},
            {"originIsolated", bfs.origenAislado},
            {"execMs", bfsMs}
        };

        // Si el origen quedo aislado tras Monte Carlo, no hay itinerario posible.
        if (bfs.origenAislado) {
            respuesta["status"] = "NO_PROFITABLE_ROUTES";
            std::cout << respuesta.dump() << std::endl;
            return 0;
        }

        // ---- 3. Floyd-Warshall: all-pairs costo + tiempo ----
        t0 = Reloj::now();
        ResultadoFloyd floyd = FloydWarshall::calcular(grafo);
        double floydMs = msDesde(t0);

        // ---- 4. Dijkstra: costo minimo desde el origen ----
        t0 = Reloj::now();
        auto dij = Dijkstra::costosMinimosDesde(grafo, origen);
        double dijMs = msDesde(t0);
        json dijJson = json::object();
        for (const auto& [iata, cm] : dij) {
            if (iata == origen || !cm.alcanzable) continue;
            dijJson[iata] = {{"costoEUR", cm.costoEUR}, {"tiempoVueloH", cm.tiempoVueloH}, {"ruta", cm.ruta}};
        }

        // ---- 5. DFS exacto ----
        t0 = Reloj::now();
        Itinerario dfs = Busqueda::dfsItinerarioOptimo(grafo, origen, maxJornadaH, escalaH, floyd.tiempo);
        dfs.execMs = msDesde(t0);

        // ---- 6. Greedy ----
        t0 = Reloj::now();
        Itinerario greedy = Greedy::construirItinerario(grafo, origen, maxJornadaH, escalaH, floyd.tiempo);
        greedy.execMs = msDesde(t0);

        respuesta["costReference"] = {
            {"dijkstraFromOrigin", dijJson},
            {"dijkstraExecMs", dijMs},
            {"floydWarshall", {{"allPairsComputed", true}, {"nodos", grafo.numNodos()}, {"execMs", floydMs}}}
        };
        respuesta["itineraries"] = {
            {"dfsExact", itinerarioAJson(dfs)},
            {"greedy", itinerarioAJson(greedy)}
        };
        respuesta["comparison"] = json::array({
            {{"algoritmo", "DFS (optimo)"}, {"valido", dfs.valido},
             {"beneficioTotalEUR", dfs.beneficioTotalEUR}, {"costoTotalEUR", dfs.costoTotalEUR},
             {"tiempoJornadaH", dfs.tiempoJornadaH}, {"tramos", dfs.tramos.size()},
             {"nodosExplorados", dfs.nodosExplorados}, {"execMs", dfs.execMs}},
            {{"algoritmo", "Greedy"}, {"valido", greedy.valido},
             {"beneficioTotalEUR", greedy.beneficioTotalEUR}, {"costoTotalEUR", greedy.costoTotalEUR},
             {"tiempoJornadaH", greedy.tiempoJornadaH}, {"tramos", greedy.tramos.size()},
             {"nodosExplorados", greedy.nodosExplorados}, {"execMs", greedy.execMs}}
        });
        respuesta["status"] = dfs.valido ? "OK" : "NO_PROFITABLE_ROUTES";

        std::cout << respuesta.dump() << std::endl;
        return 0;

    } catch (const std::exception& e) {
        std::cout << json({{"status", "ENGINE_ERROR"}, {"error", e.what()}}).dump() << std::endl;
        return 1;
    }
}