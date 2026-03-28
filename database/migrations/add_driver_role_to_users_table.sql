-- This migration adds the 'driver' role to the allowed values in the users table.
-- Run this in your Supabase SQL Editor to fix the "check constraint" error.

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('user', 'head', 'admin', 'registrar', 'driver'));

-- Verify current constraints
SELECT 
    conname AS constraint_name, 
    pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
WHERE n.nspname = 'public' AND conrelid = 'users'::regclass;
