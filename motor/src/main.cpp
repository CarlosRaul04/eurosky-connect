#include <iostream>
#include <vector>
#include <string>
#include <set>
#include "json.hpp"
#include "grafo.h"
#include "dijkstra.h"
#include "bfs_dfs.h"
#include "monte_carlo.h"

using json = nlohmann::json;

int main() {
    try {
        json contrato;
        if (!(std::cin >> contrato)) return 0;

        // 1. Preparar parametros de Monte Carlo
        ParametrosAeronave params;
        params.mu = contrato["aircraft"]["mu"];
        params.sigma = contrato["aircraft"]["sigma"];
        params.minThreshold = contrato["aircraft"]["minThreshold"];

        GrafoRutas grafo;
        
        // 2. Construccion del grafo con filtrado de Monte Carlo
        // Solo agregamos rutas que pasan la simulacion de demanda
        for (const auto& ruta : contrato["routes"]) {
            ResultadoSimulacion sim = MonteCarlo::simularDemanda(params);
            
            // Si la ruta es rentable, la agregamos al grafo
            if (sim.esRentable) {
                grafo.agregarArista(
                    ruta["origin"], ruta["destination"],
                    ruta["distanceKm"], ruta["flightTimeHours"],
                    ruta["costTotalEUR"], ruta["ticketPriceEUR"]
                );
            }
        }

        std::string origen = contrato["originIATA"];
        std::string destino = "CDG"; // Tu destino de prueba
        double limiteTiempo = contrato["maxFlightHours"];

        // 3. Algoritmos de Analisis
        // BFS: Validacion de conectividad
        std::vector<std::string> visitadosBFS = Busqueda::realizarBFS(grafo, origen);
        
        // DFS: Viabilidad temporal
        std::vector<std::string> caminoDFS;
        std::set<std::string> visitadosDFS;
        bool rutaViable = Busqueda::realizarDFS(grafo, origen, destino, limiteTiempo, caminoDFS, visitadosDFS);

        // Dijkstra: Optimizacion
        ResultadoDijkstra res = Dijkstra::calcularRutaMasBarata(grafo, origen, destino, limiteTiempo);

        // 4. Salida JSON estructurada
        json respuesta;
        respuesta["origen"] = origen;
        respuesta["destino"] = destino;
        respuesta["limite_tiempo"] = limiteTiempo;
        respuesta["red_conectada"] = (visitadosBFS.size() >= 5); // Verificamos conectividad minima
        
        respuesta["dfs_viabilidad"] = {
            {"posible", rutaViable},
            {"ruta", caminoDFS}
        };
        
        respuesta["dijkstra_optimo"] = {
            {"ruta", res.ruta},
            {"costo_total_eur", res.costoTotal},
            {"tiempo_total_horas", res.tiempoTotal},
            {"ruta_valida", res.rutaValida}
        };

        std::cout << respuesta.dump() << std::endl;

    } catch (const std::exception& e) {
        std::cout << json({{"error", e.what()}}).dump() << std::endl;
        return 1;
    }
    return 0;
}