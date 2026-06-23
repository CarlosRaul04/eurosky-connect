// motor/src/grafo.cpp
#include "grafo.h"

namespace {
    const std::vector<Arista> kSinVecinos; // vector vacio reutilizable
}

void GrafoRutas::registrarNodo(const std::string& iata) {
    adyacencia_.try_emplace(iata);
}

void GrafoRutas::agregarArista(const std::string& origen, const Arista& arista) {
    adyacencia_[origen].push_back(arista);
    registrarNodo(arista.destino); // el destino debe existir como nodo
}

const std::vector<Arista>& GrafoRutas::vecinos(const std::string& iata) const {
    auto it = adyacencia_.find(iata);
    return (it != adyacencia_.end()) ? it->second : kSinVecinos;
}

const std::unordered_map<std::string, std::vector<Arista>>& GrafoRutas::adyacencia() const {
    return adyacencia_;
}

bool GrafoRutas::existeNodo(const std::string& iata) const {
    return adyacencia_.find(iata) != adyacencia_.end();
}

std::vector<std::string> GrafoRutas::nodos() const {
    std::vector<std::string> resultado;
    resultado.reserve(adyacencia_.size());
    for (const auto& [iata, _] : adyacencia_) resultado.push_back(iata);
    return resultado;
}

std::size_t GrafoRutas::numNodos() const { return adyacencia_.size(); }

std::size_t GrafoRutas::numAristas() const {
    std::size_t total = 0;
    for (const auto& [_, aristas] : adyacencia_) total += aristas.size();
    return total;
}