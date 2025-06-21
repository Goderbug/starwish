/*
  # Fix Star Chain RLS Policies to Prevent Opening Race Conditions

  1. Problem
    - Current RLS policies are too restrictive
    - Once a star chain is marked as opened, it becomes immediately inaccessible
    - This causes race conditions during the opening process
    - Users see "expired" errors when the opening process fails mid-transaction

  2. Solution
    - Allow access to recently opened star chains (within 5 minutes)
    - This provides a time window for completing the opening process
    - Maintains security while fixing the race condition

  3. Changes
    - Update all related RLS policies to include the 5-minute grace period
    - Ensure consistent policy names across all tables
*/

-- First, let's check what policies currently exist and drop them safely
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Drop existing policies on star_chains
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'star_chains' 
        AND policyname LIKE '%can read%' 
        AND policyname LIKE '%star chains%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON star_chains', policy_record.policyname);
    END LOOP;

    -- Drop existing policies on star_chain_wishes
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'star_chain_wishes' 
        AND policyname LIKE '%can read%' 
        AND policyname LIKE '%chains%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON star_chain_wishes', policy_record.policyname);
    END LOOP;

    -- Drop existing policies on wishes
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'wishes' 
        AND policyname LIKE '%can read%' 
        AND policyname LIKE '%chains%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON wishes', policy_record.policyname);
    END LOOP;

    -- Drop existing policies on users
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'users' 
        AND policyname LIKE '%can read%' 
        AND policyname LIKE '%chains%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON users', policy_record.policyname);
    END LOOP;
END $$;

-- Now create the new policies with unique names
-- Policy for star_chains table - allows access to active chains including recently opened ones
CREATE POLICY "Public can read active star chains"
  ON star_chains
  FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true 
    AND (expires_at IS NULL OR expires_at > now())
    -- Key fix: Allow access to unopened chains OR recently opened chains (within 5 minutes)
    AND (
      is_opened = false 
      OR (is_opened = true AND opened_at > now() - interval '5 minutes')
    )
  );

-- Policy for star_chain_wishes table
CREATE POLICY "Public can read wishes from active chains"
  ON star_chain_wishes
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM star_chains 
      WHERE star_chains.id = star_chain_wishes.chain_id 
      AND star_chains.is_active = true 
      AND (star_chains.expires_at IS NULL OR star_chains.expires_at > now())
      AND (
        star_chains.is_opened = false 
        OR (star_chains.is_opened = true AND star_chains.opened_at > now() - interval '5 minutes')
      )
    )
  );

-- Policy for wishes table
CREATE POLICY "Public can read wishes through active chains"
  ON wishes
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM star_chain_wishes 
      JOIN star_chains ON star_chains.id = star_chain_wishes.chain_id
      WHERE star_chain_wishes.wish_id = wishes.id
      AND star_chains.is_active = true 
      AND (star_chains.expires_at IS NULL OR star_chains.expires_at > now())
      AND (
        star_chains.is_opened = false 
        OR (star_chains.is_opened = true AND star_chains.opened_at > now() - interval '5 minutes')
      )
    )
  );

-- Policy for users table
CREATE POLICY "Public can read creator info through active chains"
  ON users
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM star_chains 
      WHERE star_chains.creator_id = users.id
      AND star_chains.is_active = true 
      AND (star_chains.expires_at IS NULL OR star_chains.expires_at > now())
      AND (
        star_chains.is_opened = false 
        OR (star_chains.is_opened = true AND star_chains.opened_at > now() - interval '5 minutes')
      )
    )
  );

-- Add helpful comments explaining the fix
COMMENT ON POLICY "Public can read active star chains" ON star_chains IS 
'Allows public access to active star chains that are either unopened or recently opened (within 5 minutes) to prevent race conditions during opening process';

COMMENT ON POLICY "Public can read wishes from active chains" ON star_chain_wishes IS 
'Allows access to wishes through active star chains, including recently opened ones to complete the opening process';

COMMENT ON POLICY "Public can read wishes through active chains" ON wishes IS 
'Allows reading wish content through active star chains, including recently opened ones for proper completion';

COMMENT ON POLICY "Public can read creator info through active chains" ON users IS 
'Allows reading creator information through active star chains, including recently opened ones for display purposes';

-- Log the completion
DO $$
BEGIN
    RAISE NOTICE 'Star chain RLS policies have been updated to fix opening race conditions';
    RAISE NOTICE 'Active star chains now remain accessible for 5 minutes after opening';
END $$;