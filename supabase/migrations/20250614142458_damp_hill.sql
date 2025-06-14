/*
  # Add RLS policies for users table

  1. Security
    - Add INSERT policy for authenticated users to create their own profile
    - Add UPDATE policy for authenticated users to modify their own profile
    - Add SELECT policy for authenticated users to read their own profile

  This migration fixes the RLS policy violation error that occurs when users try to sign up or update their profiles.
*/

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