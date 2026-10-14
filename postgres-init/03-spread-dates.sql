-- Dispersa createdAt de seeds en últimos 14 días para series temporales con forma.
-- Los scripts init se ejecutan contra $POSTGRES_DB, por eso usamos \c para cambiar de DB.
\c products
UPDATE products SET "createdAt" = NOW() - (floor(random()*14) || ' days')::interval - (floor(random()*1440) || ' minutes')::interval WHERE "createdAt" IS NOT NULL;

\c orders
UPDATE orders SET "createdAt" = NOW() - (floor(random()*14) || ' days')::interval - (floor(random()*1440) || ' minutes')::interval WHERE "createdAt" IS NOT NULL;

\c customers
UPDATE customers SET "createdAt" = NOW() - (floor(random()*14) || ' days')::interval - (floor(random()*1440) || ' minutes')::interval WHERE "createdAt" IS NOT NULL;

\c postgres
