-- CareerIQ Pro — PostgreSQL Initialization
-- Run automatically by docker-compose on first startup

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For fuzzy text search

-- Indexes created by SQLAlchemy ORM on app startup
-- This file handles PostgreSQL-specific extensions only

-- Verify
SELECT version();
SELECT 'CareerIQ Pro DB initialized' AS status;
