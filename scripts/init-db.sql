-- Initialize database with required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum type for roles
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('USER', 'MODERATOR', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Note: Tables will be created by TypeORM synchronize in development
-- In production, use migrations
