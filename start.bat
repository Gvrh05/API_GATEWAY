@echo off
REM Levanta todo el proyecto: construye imagenes y arranca contenedores.
REM Uso: start.bat
cd /d "%~dp0"
echo ==^> Construyendo imagenes y levantando contenedores...
docker compose up --build -d
echo.
echo ==^> Estado:
docker compose ps
echo.
echo Listo. URLs (usa 127.0.0.1 con http):
echo   Frontend : http://127.0.0.1:8080/ (admin/admin123)
echo   Kong     : http://127.0.0.1:3000/health
echo   Grafana  : http://127.0.0.1:3005/ (admin/admin)
echo   Swagger  : http://127.0.0.1:3001/docs/ :3002/docs/ :3003/docs/ :3004/docs/
