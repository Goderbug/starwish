/*
  # Fix Authentication and RLS Issues

  1. Database Issues
    - Fix users table RLS policies to handle auth properly
    - Add missing function for updated_at triggers
    - Ensure proper auth.uid() function usage

  2. Security
    - Update RLS policies to be more permissive for user creation
    - Fix policy conflicts and ensure proper authentication flow
*/

-- First, let's make sure the update_updated_at_column function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop all existing policies on users table to start fresh
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;

-- Create more permissive policies for user management
-- Allow authenticated users to insert their own profile
CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Ensure RLS is enabled on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Check if the auth.uid() function works properly by creating a test policy
-- This will help debug authentication issues
DO $$
BEGIN
  -- Test if auth schema and uid function exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_schema = 'auth' AND routine_name = 'uid'
  ) THEN
    RAISE NOTICE 'Warning: auth.uid() function not found. This may cause authentication issues.';
  END IF;
END $$;

-- Add some debugging info
DO $$
BEGIN
  RAISE NOTICE 'Users table RLS policies have been reset and recreated.';
  RAISE NOTICE 'Make sure your Supabase project has authentication enabled.';
END $$;