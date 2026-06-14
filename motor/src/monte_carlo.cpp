#include "monte_carlo.h"

ResultadoSimulacion MonteCarlo::simularDemanda(const ParametrosAeronave& params) {
    // Inicializacion del generador de numeros aleatorios
    static std::random_device rd;
    static std::mt19937 gen(rd());
    
    std::normal_distribution<double> d(params.mu, params.sigma);
    
    int demanda = static_cast<int>(d(gen));
    if (demanda < 0) demanda = 0; // La demanda no puede ser negativa

    bool rentable = (demanda >= params.minThreshold);

    return {demanda, rentable};
}