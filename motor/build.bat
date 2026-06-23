@echo off
:: motor/build.bat
:: Compila el motor C++ en Windows usando g++ (MinGW / MSYS2 / Git Bash).
:: Uso: ejecutar desde la carpeta raiz del proyecto:  motor\build.bat

echo [EuroSky] Compilando motor C++...

:: Verificar que g++ este disponible
where g++ >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: g++ no esta instalado o no esta en el PATH.
    echo.
    echo Opciones para instalarlo en Windows:
    echo   1. MSYS2  ^(recomendado^): https://www.msys2.org/
    echo      Luego en MSYS2: pacman -S mingw-w64-x86_64-gcc
    echo      Y agrega C:\msys64\mingw64\bin al PATH del sistema.
    echo.
    echo   2. MinGW-w64: https://sourceforge.net/projects/mingw-w64/
    echo.
    echo   3. WSL ^(Windows Subsystem for Linux^): usa el Makefile normal.
    echo.
    exit /b 1
)

:: Crear carpeta build si no existe
if not exist "motor\build" mkdir "motor\build"

:: Compilar todos los .cpp del motor
g++ -std=c++17 -O2 -Wall ^
    -I motor\include ^
    -I motor\src ^
    motor\src\main.cpp ^
    motor\src\grafo.cpp ^
    motor\src\monte_carlo.cpp ^
    motor\src\bfs_dfs.cpp ^
    motor\src\dijkstra.cpp ^
    motor\src\floyd_warshall.cpp ^
    motor\src\greedy.cpp ^
    -o motor\build\motor.exe

if errorlevel 1 (
    echo.
    echo ERROR: La compilacion fallo. Revisa los mensajes de arriba.
    exit /b 1
)

echo [EuroSky] Motor compilado correctamente en motor\build\motor.exe