// motor/src/monte_carlo.cpp
#include "monte_carlo.h"
#include <algorithm>
#include <cmath>

MuestraDemanda MonteCarlo::simularArista(std::mt19937& gen,
                                         const ParametrosAeronave& aeronave,
                                         double precioBoletoEUR,
                                         double costoTotalEUR) {
    std::normal_distribution<double> normal(aeronave.mu, aeronave.sigma);

    // Una muestra de demanda del dia. NO se trunca por abajo: el modelo permite
    // que algunos dias la ocupacion caiga bajo el umbral del 70%, lo que hace
    // que la ruta se descarte (ese es el filtro de viabilidad de Monte Carlo).
    // Por arriba se topa en la capacidad: ningun vuelo embarca mas pasajeros que
    // sus asientos (demanda excedente = vuelo lleno).
    double valor = normal(gen);
    int pax = static_cast<int>(std::lround(valor));
    pax = std::clamp(pax, 0, aeronave.capacidadMax);

    MuestraDemanda m;
    m.pax           = pax;
    m.ingresoEUR    = pax * precioBoletoEUR;
    m.beneficioEUR  = m.ingresoEUR - costoTotalEUR;
    m.factible      = (pax >= aeronave.umbralMin) && (m.beneficioEUR > 0.0);
    return m;
}