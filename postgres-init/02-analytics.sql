-- Tabla de analítica de accesos/uso. Se ejecuta contra la DB $POSTGRES_DB (postgres).
CREATE TABLE IF NOT EXISTS access_log (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL DEFAULT 'anonymous',
  action VARCHAR(50) NOT NULL DEFAULT 'page_view',
  route VARCHAR(300) NOT NULL DEFAULT '/',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_access_log_created ON access_log (created_at);
CREATE INDEX IF NOT EXISTS idx_access_log_user ON access_log (username);
CREATE INDEX IF NOT EXISTS idx_access_log_action ON access_log (action);

-- Backfill sintético ~140 eventos últimos 14 días (para que Grafana no esté vacío).
INSERT INTO access_log (username, action, route, created_at)
SELECT
  (ARRAY['admin','user','admin','user','anonymous'])[1 + (floor(random()*5))::int],
  (ARRAY['login','page_view','page_view','list_products','list_orders','list_customers','create_order','create_product'])[1 + (floor(random()*8))::int],
  (ARRAY['/','/productos','/clientes','/pedidos','/auth/login','/api/products','/api/orders','/api/customers'])[1 + (floor(random()*8))::int],
  NOW() - (floor(random()*14) || ' days')::interval - (floor(random()*1440) || ' minutes')::interval
FROM generate_series(1, 140)
ON CONFLICT DO NOTHING;
