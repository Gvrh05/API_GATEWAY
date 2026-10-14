# Proyecto Parte 1 — Microservicios + Kong + Grafana + Frontend

## Arquitectura
- `product-service` (:3001, DB `products`), `order-service` (:3002, DB `orders`), `customer-service` (:3003, DB `customers`), `auth-service` (:3004, JWT + health agregado + `/analytics`).
- `postgres:16` único con 4 DBs (`postgres/products/orders/customers`). Init en `postgres-init/` (`.sh` + `.sql`, todos LF).
- `kong:3.7` DB-less en `:3000` (proxy) y `:8001` (admin). JWT para `/api/*`, público `POST /auth/login`, `GET /health`, `POST /analytics`.
- `frontend` (:8080, nginx estático): login, tabs Productos/Clientes/Pedidos, alta de registros. Llama a su mismo origen (`/auth`, `/api`, `/analytics`, `/health`) y nginx lo reenvía a Kong, así no hay CORS ni problemas con `localhost`.
- `grafana:11` (:3005, admin/admin): datasources Postgres provisionados + dashboard “Plataforma - Accesos y Negocio”.

## Requisitos
Docker Desktop con Compose v2.

## Quickstart
```powershell
docker compose up --build -d
docker compose ps
docker compose logs -f kong auth-service
```

## Puertos y credenciales (usa `http://127.0.0.1`, no `localhost`)
| Qué | URL | Credenciales |
|---|---|---|
| Frontend | http://127.0.0.1:8080/ | admin/admin123, user/user123 |
| Kong proxy | http://127.0.0.1:3000 | — |
| Kong admin | http://127.0.0.1:8001/ | — |
| Grafana | http://127.0.0.1:3005/ | admin/admin |
| Swagger | http://127.0.0.1:3001/docs/ :3002/docs/ :3003/docs/ :3004/docs/ | — |
| Postgres | 127.0.0.1:5432 postgres/postgres | DBs: postgres, products, orders, customers |

Login API:
```powershell
curl -X POST http://127.0.0.1:3000/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}'
curl http://127.0.0.1:3000/api/products/products -H "Authorization: Bearer <token>"
curl http://127.0.0.1:3000/api/orders/orders -H "Authorization: Bearer <token>"
curl http://127.0.0.1:3000/api/customers/customers -H "Authorization: Bearer <token>"
curl http://127.0.0.1:3000/health
```
Vía Kong la ruta es doble (`strip_path: true`): `/api/products/products`, `/api/orders/orders`, `/api/customers/customers`.

## Datos / seeds
Cada servicio tiene `SEED_ON_START=true` y `seedIfEmpty()` (10 productos, 5 clientes, 8 pedidos coherentes). `postgres-init/02-analytics.sql` crea `access_log` + 140 eventos sintéticos 14 días; `03-spread-dates.sql` dispersa `createdAt` para que las series de Grafana tengan forma. El frontend además registra accesos reales (`login`, `page_view`, `list_*`, `create_*`) vía `POST /analytics`.

## Grafana
1. Abre http://127.0.0.1:3005/login e ingresa `admin/admin`.
2. Abre el dashboard directo: http://127.0.0.1:3005/d/plataforma-accesos/plataforma-accesos-y-negocio (o menú Dashboards → “Plataforma - Accesos y Negocio”).
3. Rango recomendado: Last 14 days.
Paneles: accesos por día, logins por usuario, acciones por tipo, top rutas, ventas por día (excluye CANCELLED), pedidos por estado + ticket promedio, top clientes por gasto, stock crítico (<50).

## Troubleshooting
- `postgres` exit 126 `/bin/sh^M`: `postgres-init/*.sh` debe estar en LF, no CRLF.
- `ignoring /docker-entrypoint-initdb.d/*`: el glob no expandió (volumen con datos viejos). Usar `docker compose down -v` solo si se acepta borrar datos.
- `database "products" does not exist`: el init no creó DBs; crear manual y `docker compose restart product-service order-service customer-service`.
- Kong 401 en `/api/*`: falta/expired `Authorization: Bearer`. El login dura 1h (`JWT_EXPIRES_IN`).
- Kong 404 `Cannot GET /` en `/api/products`: usa la ruta doble (`/api/products/products`).
- Rate limit: login 5/min, resto 10/min por IP. Kong responde `429 + Retry-After`; el front muestra “Límite excedido (429)”. Demo: dispara 6-7 logins seguidos y verás los `429`.
- El navegador no resuelve `localhost` en este entorno: usa `127.0.0.1` con `http://` y recarga con `Ctrl+F5`.
