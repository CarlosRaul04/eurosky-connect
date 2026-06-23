// motor/src/greedy.h
//
// Heuristica voraz: en cada paso elige la arista factible de mayor beneficio
// neto b(u,v) que aun permita cerrar el ciclo al origen dentro de la jornada.
// No garantiza el optimo (a diferencia del DFS), pero corre en tiempo casi
// lineal sobre el camino construido y sirve de comparacion academica.
//
// Complejidad: O(L * E) donde L es la longitud del itinerario (acotada por la
// jornada de 8 h), muy por debajo del DFS exhaustivo.
#ifndef GREEDY_H
#define GREEDY_H

#include "grafo.h"
#include "itinerario.h"
#include "floyd_warshall.h"
#include <string>

class Greedy {
public:
    static Itinerario construirItinerario(const GrafoRutas& grafo,
                                          const std::string& origen,
                                          double maxJornadaH,
                                          double escalaH,
                                          const MatrizPesos& tiempoMin);
};

#endif // GREEDY_H