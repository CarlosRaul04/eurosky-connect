// motor/src/grafo.h
//
// Grafo ponderado dirigido de la red de aeropuertos.
// Cada arista (u -> v) transporta los tres pesos que el resto de los
// algoritmos necesitan:
//   - tiempoVueloH : tiempo de vuelo del tramo (horas)        -> restriccion de jornada
//   - costoEUR     : costo operativo total CT(u,v) (EUR)      -> Dijkstra / Floyd-Warshall
//   - beneficioEUR : beneficio neto b(u,v) (EUR)              -> Greedy / DFS (objetivo)
//
// La factibilidad de una arista (pax >= umbral y b(u,v) > 0) la decide
// Monte Carlo; las aristas inviables simplemente no se insertan en el grafo.
#ifndef GRAFO_H
#define GRAFO_H

#include <string>
#include <vector>
#include <unordered_map>

struct Arista {
    std::string destino;
    double distanciaKm;
    double tiempoVueloH;
    double costoEUR;       // CT(u,v): peso para minimizacion de costo
    double precioBoletoEUR;
    int    paxSimulados;   // demanda del dia (Monte Carlo)
    double ingresoEUR;     // pax * precio
    double beneficioEUR;   // b(u,v) = ingreso - CT: peso para maximizacion
};

class GrafoRutas {
private:
    // Lista de adyacencia: IATA -> aristas salientes. Grafo disperso (STL).
    std::unordered_map<std::string, std::vector<Arista>> adyacencia_;

public:
    // Inserta un nodo aislado si aun no existe (garantiza que aparezca en
    // recorridos aunque no tenga aristas factibles).
    void registrarNodo(const std::string& iata);

    // Inserta una arista factible u -> v. Complejidad: O(1) amortizado.
    void agregarArista(const std::string& origen, const Arista& arista);

    // Acceso de solo lectura para los algoritmos.
    const std::vector<Arista>& vecinos(const std::string& iata) const;
    const std::unordered_map<std::string, std::vector<Arista>>& adyacencia() const;

    bool existeNodo(const std::string& iata) const;
    std::vector<std::string> nodos() const;
    std::size_t numNodos() const;
    std::size_t numAristas() const;
};

#endif // GRAFO_H