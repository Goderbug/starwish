/*
  # Fix RLS policies for users table

  1. Security
    - Drop existing policies if they exist to avoid conflicts
    - Recreate policies for users table:
      - Users can insert their own profile
      - Users can update their own profile  
      - Users can read their own profile
*/

-- Drop existing policies if they exist (using IF EXISTS to avoid errors)
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;

-- Create INSERT policy for users to create their own profile
CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create UPDATE policy for users to modify their own profile  
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create SELECT policy for users to read their own profile
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);