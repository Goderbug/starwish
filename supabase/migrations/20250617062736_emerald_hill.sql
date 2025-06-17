/*
  # Add opened status tracking to star chains

  1. Changes
    - Add `is_opened` boolean field to track if the blind box has been opened
    - Add `opened_at` timestamp to record when it was opened
    - Add `opener_fingerprint` to track who opened it
    - Update existing chains to have `is_opened = false`

  2. Security
    - No changes to RLS policies needed as this is just adding tracking fields
*/

-- Add new columns to star_chains table
DO $$
BEGIN
  -- Add is_opened column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'star_chains' AND column_name = 'is_opened'
  ) THEN
    ALTER TABLE star_chains ADD COLUMN is_opened boolean DEFAULT false;
  END IF;

  -- Add opened_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'star_chains' AND column_name = 'opened_at'
  ) THEN
    ALTER TABLE star_chains ADD COLUMN opened_at timestamptz;
  END IF;

  -- Add opener_fingerprint column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'star_chains' AND column_name = 'opener_fingerprint'
  ) THEN
    ALTER TABLE star_chains ADD COLUMN opener_fingerprint text;
  END IF;
END $$;

-- Update existing star chains to be unopened
UPDATE star_chains 
SET is_opened = false 
WHERE is_opened IS NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_star_chains_opened_status 
ON star_chains(is_opened, opened_at);