#ifndef MONTE_CARLO_H
#define MONTE_CARLO_H

#include "grafo.h"
#include <random>

struct ParametrosAeronave {
    double mu;
    double sigma;
    int minThreshold;
};

struct ResultadoSimulacion {
    int demandaSimulada;
    bool esRentable;
};

class MonteCarlo {
public:
    static ResultadoSimulacion simularDemanda(const ParametrosAeronave& params);
};

#endif