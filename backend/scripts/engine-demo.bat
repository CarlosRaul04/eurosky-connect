@echo off
:: scripts/engine-demo.bat
:: Ejecuta una optimizacion de prueba sin levantar el servidor.
:: Aeronave: Airbus A320neo, Origen: FRA, Semilla Monte Carlo: 42

echo [EuroSky] Ejecutando demo del motor (FRA, A320neo, seed 42)...
echo.

if not exist "motor\build\motor.exe" (
    echo ERROR: motor.exe no encontrado. Compila primero con:  motor\build.bat
    exit /b 1
)

node backend\scripts\generateInput.js "Airbus A320neo" "FRA" 42 | motor\build\motor.exe