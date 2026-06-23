// motor/src/itinerario.h
//
// Tipos compartidos que describen un itinerario diario en ciclo cerrado
// (empieza y termina en el aeropuerto de origen, sin repetir intermedios).
// Lo producen tanto el DFS exacto como el Greedy heuristico.
#ifndef ITINERARIO_H
#define ITINERARIO_H

#include <string>
#include <vector>

struct Tramo {
    std::string origen;
    std::string destino;
    double tiempoVueloH;
    double costoEUR;
    double beneficioEUR;
    int    pax;
};

struct Itinerario {
    std::vector<std::string> ruta;      // [O, a1, ..., am, O]
    std::vector<Tramo>       tramos;
    double tiempoJornadaH    = 0.0;     // vuelos + escalas de 30 min
    double costoTotalEUR     = 0.0;
    double beneficioTotalEUR = 0.0;
    bool   valido            = false;
    long   nodosExplorados   = 0;       // metrica de comparacion
    double execMs            = 0.0;
};

// Tiempo de jornada = sum(tiempos de vuelo) + escala * (numTramos - 1).
// Cada aterrizaje intermedio exige una escala antes del siguiente despegue;
// el aterrizaje final en el origen cierra la jornada y no requiere escala.
inline double tiempoJornada(double sumaVuelosH, std::size_t numTramos, double escalaH) {
    if (numTramos == 0) return 0.0;
    return sumaVuelosH + escalaH * static_cast<double>(numTramos - 1);
}

#endif // ITINERARIO_H