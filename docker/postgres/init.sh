#!/bin/bash
# Creates the shadow database used by Prisma migrate dev.
# Docker PostgreSQL runs this script only on first container init (empty data dir).
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  SELECT 'Creating shadow database for Prisma migrations...' AS status;
  CREATE DATABASE angaly_shadow;
  GRANT ALL PRIVILEGES ON DATABASE angaly_shadow TO "$POSTGRES_USER";
EOSQL
