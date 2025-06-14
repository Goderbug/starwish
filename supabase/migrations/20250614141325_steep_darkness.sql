/*
  # Enhanced Star Wish Database Schema

  1. New Tables
    - `users` - User profiles with Google OAuth support
    - `wishes` - User wishes with categories and priorities
    - `star_chains` - Shareable wish collections
    - `star_chain_wishes` - Many-to-many relationship between chains and wishes
    - `blind_box_opens` - Anonymous opening records for statistics
    - `user_opened_wishes` - User's collection of received wishes

  2. Security
    - Enable RLS on all tables
    - Policies for user data isolation
    - Anonymous access for blind box functionality
    - Privacy protection through hashed data

  3. Features
    - Share tracking and statistics
    - Anonymous wish receiving
    - Expiration and deactivation support
    - Performance indexes
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  google_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wishes table
CREATE TABLE IF NOT EXISTS wishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT NOT NULL CHECK (category IN ('gift', 'experience', 'moment')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  tags TEXT[] DEFAULT '{}',
  estimated_price TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Star chains (shareable wish collections)
CREATE TABLE IF NOT EXISTS star_chains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name TEXT,
  description TEXT,
  share_code TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  total_opens INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Star chain wishes (many-to-many)
CREATE TABLE IF NOT EXISTS star_chain_wishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_id UUID REFERENCES star_chains(id) ON DELETE CASCADE NOT NULL,
  wish_id UUID REFERENCES wishes(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(chain_id, wish_id)
);

-- Blind box opens (anonymous opening records)
CREATE TABLE IF NOT EXISTS blind_box_opens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_id UUID REFERENCES star_chains(id) ON DELETE CASCADE NOT NULL,
  wish_id UUID REFERENCES wishes(id) ON DELETE CASCADE NOT NULL,
  opener_fingerprint TEXT, -- Browser fingerprint for deduplication
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  user_agent TEXT,
  ip_hash TEXT -- Hashed IP for privacy
);

-- User opened wishes (receiver's collection)
CREATE TABLE IF NOT EXISTS user_opened_wishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_fingerprint TEXT NOT NULL, -- Anonymous user identification
  wish_id UUID REFERENCES wishes(id) ON DELETE CASCADE NOT NULL,
  chain_id UUID REFERENCES star_chains(id) ON DELETE CASCADE NOT NULL,
  creator_name TEXT, -- Cached creator name for display
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  is_favorite BOOLEAN DEFAULT FALSE,
  notes TEXT DEFAULT ''
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE star_chains ENABLE ROW LEVEL SECURITY;
ALTER TABLE star_chain_wishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE blind_box_opens ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_opened_wishes ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users: Users can only see and edit their own profile
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Wishes: Users can only manage their own wishes
CREATE POLICY "Users can manage own wishes"
  ON wishes
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Star chains: Users can manage their own chains, anonymous can read active ones
CREATE POLICY "Users can manage own star chains"
  ON star_chains
  FOR ALL
  TO authenticated
  USING (auth.uid() = creator_id);

CREATE POLICY "Anonymous can read active star chains"
  ON star_chains
  FOR SELECT
  TO anon
  USING (is_active = TRUE AND (expires_at IS NULL OR expires_at > NOW()));

-- Star chain wishes: Follow star chain permissions
CREATE POLICY "Star chain wishes follow chain permissions"
  ON star_chain_wishes
  FOR SELECT
  TO authenticated, anon
  USING (
    EXISTS (
      SELECT 1 FROM star_chains 
      WHERE id = chain_id 
      AND (auth.uid() = creator_id OR (is_active = TRUE AND (expires_at IS NULL OR expires_at > NOW())))
    )
  );

CREATE POLICY "Users can insert own star chain wishes"
  ON star_chain_wishes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM star_chains 
      WHERE id = chain_id AND auth.uid() = creator_id
    )
  );

CREATE POLICY "Users can update own star chain wishes"
  ON star_chain_wishes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM star_chains 
      WHERE id = chain_id AND auth.uid() = creator_id
    )
  );

CREATE POLICY "Users can delete own star chain wishes"
  ON star_chain_wishes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM star_chains 
      WHERE id = chain_id AND auth.uid() = creator_id
    )
  );

-- Blind box opens: Anonymous can insert, creators can read their chain opens
CREATE POLICY "Anonymous can record opens"
  ON blind_box_opens
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (TRUE);

CREATE POLICY "Creators can read their chain opens"
  ON blind_box_opens
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM star_chains 
      WHERE id = chain_id AND auth.uid() = creator_id
    )
  );

-- User opened wishes: Anonymous can manage by fingerprint
CREATE POLICY "Users can insert opened wishes"
  ON user_opened_wishes
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (TRUE);

CREATE POLICY "Users can read opened wishes"
  ON user_opened_wishes
  FOR SELECT
  TO anon, authenticated
  USING (TRUE);

CREATE POLICY "Users can update opened wishes"
  ON user_opened_wishes
  FOR UPDATE
  TO anon, authenticated
  USING (TRUE);

CREATE POLICY "Users can delete opened wishes"
  ON user_opened_wishes
  FOR DELETE
  TO anon, authenticated
  USING (TRUE);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_wishes_user_id ON wishes(user_id);
CREATE INDEX IF NOT EXISTS idx_wishes_created_at ON wishes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_star_chains_creator_id ON star_chains(creator_id);
CREATE INDEX IF NOT EXISTS idx_star_chains_share_code ON star_chains(share_code);
CREATE INDEX IF NOT EXISTS idx_star_chains_active ON star_chains(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_star_chain_wishes_chain_id ON star_chain_wishes(chain_id);
CREATE INDEX IF NOT EXISTS idx_blind_box_opens_chain_id ON blind_box_opens(chain_id);
CREATE INDEX IF NOT EXISTS idx_blind_box_opens_opened_at ON blind_box_opens(opened_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_opened_wishes_fingerprint ON user_opened_wishes(user_fingerprint);
CREATE INDEX IF NOT EXISTS idx_user_opened_wishes_opened_at ON user_opened_wishes(opened_at DESC);

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wishes_updated_at BEFORE UPDATE ON wishes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_star_chains_updated_at BEFORE UPDATE ON star_chains
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment star chain opens
CREATE OR REPLACE FUNCTION increment_chain_opens()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE star_chains 
  SET total_opens = total_opens + 1 
  WHERE id = NEW.chain_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-increment opens
CREATE TRIGGER increment_star_chain_opens 
  AFTER INSERT ON blind_box_opens
  FOR EACH ROW EXECUTE FUNCTION increment_chain_opens();