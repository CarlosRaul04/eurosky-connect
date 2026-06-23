// motor/src/monte_carlo.h
//
// Simulacion estocastica de la demanda diaria (metodo de Monte Carlo).
// Para cada arista se toma UNA muestra de pasajeros del dia desde una normal
// truncada N(mu, sigma^2) en [umbral, capacidad] y se calcula el beneficio
// neto b(u,v). La arista es factible solo si pax >= umbral y b(u,v) > 0.
//
// Complejidad por arista: O(1) esperado (muestreo por rechazo acotado).
#ifndef MONTE_CARLO_H
#define MONTE_CARLO_H

#include <random>

struct ParametrosAeronave {
    double mu;
    double sigma;
    int    umbralMin;     // 70% de la capacidad
    int    capacidadMax;
};

struct MuestraDemanda {
    int    pax;
    double ingresoEUR;
    double beneficioEUR;  // b(u,v) = ingreso - CT
    bool   factible;      // pax >= umbral && b(u,v) > 0
};

class MonteCarlo {
public:
    // El generador se inyecta para permitir ejecuciones reproducibles (semilla).
    static MuestraDemanda simularArista(std::mt19937& gen,
                                        const ParametrosAeronave& aeronave,
                                        double precioBoletoEUR,
                                        double costoTotalEUR);
};

#endif // MONTE_CARLO_H