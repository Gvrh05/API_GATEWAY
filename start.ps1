# ==============================================================================
# start.ps1 - Script de levantamiento del proyecto (Windows PowerShell)
# Microservicios NestJS + Kong Gateway + Postgres + Grafana + Frontend
# Uso: powershell -ExecutionPolicy Bypass -File .\start.ps1
# ==============================================================================

$ErrorActionPreference = "Stop"

# Colores para mensajes profesionales
$Cyan   = "Cyan"
$Green  = "Green"
$Yellow = "Yellow"
$Red    = "Red"

function Write-Step($n, $msg) {
    Write-Host "`n[$n] $msg" -ForegroundColor $Yellow
}

# Siempre ejecutar desde la carpeta del script (raiz donde esta docker-compose.yml)
Set-Location $PSScriptRoot

Write-Host "==================================================================" -ForegroundColor $Cyan
Write-Host "  MICROSERVICIOS NESTJS + KONG GATEWAY - DOCKER COMPOSE"             -ForegroundColor $Cyan
Write-Host "==================================================================" -ForegroundColor $Cyan

# ------------------------------------------------------------------------------
# 1. Verificar que Docker esta instalado y corriendo
# ------------------------------------------------------------------------------
Write-Step "1/7" "Verificando Docker..."

try {
    $dockerVersion = docker --version 2>$null
    if ($LASTEXITCODE -ne 0) { throw "docker no encontrado" }
} catch {
    Write-Host "  ERROR: Docker no esta instalado." -ForegroundColor $Red
    Write-Host "  Instala Docker Desktop: https://www.docker.com/products/docker-desktop/" -ForegroundColor $Red
    exit 1
}

docker info *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: Docker no esta corriendo." -ForegroundColor $Red
    Write-Host "  Inicia Docker Desktop y vuelve a ejecutar el script." -ForegroundColor $Red
    exit 1
}
Write-Host "  Docker OK: $dockerVersion" -ForegroundColor $Green

docker compose version *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: 'docker compose' (Compose v2) no disponible. Actualiza Docker Desktop." -ForegroundColor $Red
    exit 1
}

if (-not (Test-Path "./docker-compose.yml")) {
    Write-Host "  ERROR: No se encontro docker-compose.yml en $PSScriptRoot" -ForegroundColor $Red
    exit 1
}

# Crear .env a partir de .env.example si no existe (evita warnings de variables)
if ((-not (Test-Path "./.env")) -and (Test-Path "./.env.example")) {
    Write-Host "  Creando .env desde .env.example..." -ForegroundColor $Cyan
    Copy-Item "./.env.example" "./.env"
}

# ------------------------------------------------------------------------------
# 2. Detener contenedores previos
# ------------------------------------------------------------------------------
Write-Step "2/7" "Deteniendo contenedores previos (docker compose down)..."
docker compose down
Write-Host "  Contenedores detenidos." -ForegroundColor $Green

# ------------------------------------------------------------------------------
# 3. Construir las imagenes
# ------------------------------------------------------------------------------
Write-Step "3/7" "Construyendo imagenes (docker compose build)..."
docker compose build
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: Fallo la construccion de las imagenes." -ForegroundColor $Red
    exit 1
}
Write-Host "  Imagenes construidas correctamente." -ForegroundColor $Green

# ------------------------------------------------------------------------------
# 4. Levantar los servicios
# ------------------------------------------------------------------------------
Write-Step "4/7" "Levantando servicios (docker compose up -d)..."
docker compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: Fallo el levantamiento de los servicios." -ForegroundColor $Red
    exit 1
}
Write-Host "  Servicios levantados." -ForegroundColor $Green

# ------------------------------------------------------------------------------
# 5. Esperar a que los servicios esten listos
# ------------------------------------------------------------------------------
Write-Step "5/7" "Esperando a que los servicios esten listos..."

# Los servicios NestJS usan 'npm run start:dev', tardan ~30-60s en compilar.
$maxIntentos = 18        # 18 x 10s = hasta 3 minutos
$esperaSeg   = 10
$gatewayOk   = $false

for ($i = 1; $i -le $maxIntentos; $i++) {
    Write-Host "  Intento $i/$maxIntentos esperando al gateway (http://127.0.0.1:3000/health)..." -ForegroundColor $Cyan
    try {
        $r = Invoke-WebRequest -Uri "http://127.0.0.1:3000/health" -Method GET -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        if ($r.StatusCode -eq 200) { $gatewayOk = $true; break }
    } catch {
        Start-Sleep -Seconds $esperaSeg
        continue
    }
    Start-Sleep -Seconds $esperaSeg
}

if ($gatewayOk) {
    Write-Host "  Gateway Kong responde correctamente." -ForegroundColor $Green
} else {
    Write-Host "  AVISO: Kong aun no responde en /health. Revisa 'docker compose logs kong auth-service'." -ForegroundColor $Yellow
    Write-Host "  Los microservicios NestJS pueden tardar 1-2 min mas en compilar (start:dev)." -ForegroundColor $Yellow
}

# ------------------------------------------------------------------------------
# 6. Mostrar estado de los contenedores
# ------------------------------------------------------------------------------
Write-Step "6/7" "Estado de los contenedores:"
docker compose ps

# ------------------------------------------------------------------------------
# 7. URLs de prueba y comandos utiles
# ------------------------------------------------------------------------------
Write-Step "7/7" "Servicios disponibles:"
Write-Host ""
Write-Host "  Frontend (entrada principal):" -ForegroundColor $Green
Write-Host "    App     : http://127.0.0.1:8080/  (admin/admin123, user/user123)"
Write-Host ""
Write-Host "  Kong Gateway (entrada unica API):" -ForegroundColor $Green
Write-Host "    Health  : http://127.0.0.1:3000/health"
Write-Host "    Login   : POST http://127.0.0.1:3000/auth/login"
Write-Host "    Productos: GET http://127.0.0.1:3000/api/products/products  (requiere Bearer)"
Write-Host "    Pedidos : GET http://127.0.0.1:3000/api/orders/orders  (requiere Bearer)"
Write-Host "    Clientes: GET http://127.0.0.1:3000/api/customers/customers  (requiere Bearer)"
Write-Host "    Admin   : http://127.0.0.1:8001/"
Write-Host ""
Write-Host "  Microservicios (directo, solo desarrollo):" -ForegroundColor $Green
Write-Host "    Products : http://127.0.0.1:3001/docs/"
Write-Host "    Orders   : http://127.0.0.1:3002/docs/"
Write-Host "    Customers: http://127.0.0.1:3003/docs/"
Write-Host "    Auth     : http://127.0.0.1:3004/docs/"
Write-Host ""
Write-Host "  Observabilidad:" -ForegroundColor $Green
Write-Host "    Grafana : http://127.0.0.1:3005/  (admin/admin)"
Write-Host "    Postgres: 127.0.0.1:5432  (postgres/postgres, DBs: postgres/products/orders/customers)"
Write-Host ""

Write-Host "  Comandos utiles:" -ForegroundColor $Cyan
Write-Host "    Ver logs en vivo     : docker compose logs -f"
Write-Host "    Logs del gateway     : docker compose logs -f kong auth-service"
Write-Host "    Logs de un servicio  : docker compose logs -f product-service"
Write-Host "    Detener todo         : docker compose down"
Write-Host "    Detener y borrar datos: docker compose down -v  (CUIDADO: borra Postgres y Grafana)"
Write-Host '    Probar login         : curl -X POST http://127.0.0.1:3000/auth/login -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"password\":\"admin123\"}"'
Write-Host ""

Write-Host "==================================================================" -ForegroundColor $Green
Write-Host "  PROYECTO LEVANTADO CON EXITO"                                    -ForegroundColor $Green
Write-Host "==================================================================" -ForegroundColor $Green
