/*
  # Fix user policies

  1. Security
    - Drop existing policies if they exist to avoid conflicts
    - Recreate policies for users table
    - Allow authenticated users to manage their own profile data

  2. Changes
    - Safe policy creation with conflict resolution
    - Maintains same security model as before
*/

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;

-- Add INSERT policy for users to create their own profile
CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Add UPDATE policy for users to modify their own profile  
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Add SELECT policy for users to read their own profile
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);