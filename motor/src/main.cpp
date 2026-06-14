// motor/src/main.cpp
#include <iostream>
#include <string>
#include "json.hpp"
#include "grafo.h"
#include "dijkstra.h" // ¡Incluimos nuestro nuevo algoritmo!

using json = nlohmann::json;

int main() {
    try {
        json contrato;
        std::cin >> contrato;

        std::string origen = contrato["originIATA"];
        std::string modelo = contrato["aircraft"]["model"];

        GrafoRutas grafo;
        for (const auto& ruta : contrato["routes"]) {
            grafo.agregarArista(ruta["origin"], ruta["destination"],
                                ruta["distanceKm"], ruta["flightTimeHours"],
                                ruta["costTotalEUR"], ruta["ticketPriceEUR"]);
        }

        std::cout << "\n[Motor C++] JSON procesado exitosamente." << std::endl;
        // Comentamos la impresión del grafo entero para no ensuciar la consola
        // grafo.mostrarGrafo(); 

        // ==========================================
        // EJECUCIÓN DE DIJKSTRA
        // ==========================================
        std::string destinoPrueba = "WAW"; // Varsovia
        std::cout << "\n[Dijkstra] Calculando ruta de MENOR COSTO desde " << origen << " hasta " << destinoPrueba << "..." << std::endl;

        ResultadoDijkstra res = Dijkstra::calcularRutaMasBarata(grafo, origen, destinoPrueba);

        std::cout << "------------------------------------------" << std::endl;
        std::cout << "RUTA OPTIMIZADA ENCONTRADA" << std::endl;
        std::cout << "Camino: ";
        for (size_t i = 0; i < res.ruta.size(); i++) {
            std::cout << res.ruta[i] << (i < res.ruta.size() - 1 ? " -> " : "");
        }
        std::cout << "\nCosto Operativo Total: " << res.costoTotal << " EUR" << std::endl;
        std::cout << "Tiempo Estimado de Vuelo: " << res.tiempoTotal << " Horas" << std::endl;
        std::cout << "------------------------------------------\n" << std::endl;

    } catch (const std::exception& e) {
        std::cerr << "Error critico en el Motor C++: " << e.what() << std::endl;
        return 1;
    }
    
    return 0;
}