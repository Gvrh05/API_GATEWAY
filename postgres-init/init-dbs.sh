#!/bin/sh
set -e
# Crea las 3 bases de datos (una por microservicio) en el mismo Postgres.
for db in products orders customers; do
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
    -c "SELECT 1 FROM pg_database WHERE datname = '$db'" \
    | grep -q 1 || psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c "CREATE DATABASE \"$db\";"
done
