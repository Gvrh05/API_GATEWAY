# Levanta todo el proyecto: construye imagenes y arranca contenedores.
# Uso: powershell -ExecutionPolicy Bypass -File .\start.ps1
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "==> Construyendo imagenes y levantando contenedores..." -ForegroundColor Green
docker compose up --build -d

Write-Host "`n==> Estado:" -ForegroundColor Green
docker compose ps

Write-Host "`nListo. URLs (usa 127.0.0.1 con http):" -ForegroundColor Green
Write-Host "  Frontend : http://127.0.0.1:8080/ (admin/admin123)"
Write-Host "  Kong     : http://127.0.0.1:3000/health"
Write-Host "  Grafana  : http://127.0.0.1:3005/ (admin/admin)"
Write-Host "  Swagger  : http://127.0.0.1:3001/docs/ :3002/docs/ :3003/docs/ :3004/docs/"
