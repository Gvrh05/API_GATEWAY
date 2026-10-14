-- Dispersa createdAt de seeds en últimos 14 días para series temporales con forma.
-- Los scripts init se ejecutan contra $POSTGRES_DB, por eso usamos \c para cambiar de DB.
-- NOTA: las tablas products/orders/customers las crea TypeORM (DB_SYNCHRONIZE) DESPUES
-- del init de postgres, asi que estos UPDATE solo corren si la tabla ya existe.
-- Si no existe, se omite sin error para no tumbar el init (exit 3).
\c products
DO $$
BEGIN
  IF to_regclass('public.products') IS NOT NULL THEN
    EXECUTE 'UPDATE products SET "createdAt" = NOW() - (floor(random()*14) || '' days'')::interval - (floor(random()*1440) || '' minutes'')::interval WHERE "createdAt" IS NOT NULL';
  ELSE
    RAISE NOTICE 'tabla products aun no existe, se omite dispersar fechas';
  END IF;
END $$;

\c orders
DO $$
BEGIN
  IF to_regclass('public.orders') IS NOT NULL THEN
    EXECUTE 'UPDATE orders SET "createdAt" = NOW() - (floor(random()*14) || '' days'')::interval - (floor(random()*1440) || '' minutes'')::interval WHERE "createdAt" IS NOT NULL';
  ELSE
    RAISE NOTICE 'tabla orders aun no existe, se omite dispersar fechas';
  END IF;
END $$;

\c customers
DO $$
BEGIN
  IF to_regclass('public.customers') IS NOT NULL THEN
    EXECUTE 'UPDATE customers SET "createdAt" = NOW() - (floor(random()*14) || '' days'')::interval - (floor(random()*1440) || '' minutes'')::interval WHERE "createdAt" IS NOT NULL';
  ELSE
    RAISE NOTICE 'tabla customers aun no existe, se omite dispersar fechas';
  END IF;
END $$;

\c postgres
