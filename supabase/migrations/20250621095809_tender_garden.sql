-- 如果需要更严格的安全策略，可以使用这个版本
-- 这个版本添加了额外的安全检查

-- 删除现有策略
DROP POLICY IF EXISTS "Anyone can read accessible star chains" ON star_chains;
DROP POLICY IF EXISTS "Anyone can read wishes from accessible chains" ON star_chain_wishes;
DROP POLICY IF EXISTS "Anyone can read wishes through accessible chains" ON wishes;
DROP POLICY IF EXISTS "Anyone can read creator info through accessible chains" ON users;

-- 创建更安全的策略，添加IP和时间限制
CREATE POLICY "Secure access to star chains"
  ON star_chains
  FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true 
    AND (expires_at IS NULL OR expires_at > now())
    AND (
      -- 未开启的星链可以访问
      is_opened = false 
      -- 或者刚开启不久的星链（缩短到2分钟）
      OR (is_opened = true AND opened_at > now() - interval '2 minutes')
    )
    -- 可选：添加创建时间限制，防止访问过老的星链
    AND created_at > now() - interval '30 days'
  );

-- 为star_chain_wishes表创建安全策略
CREATE POLICY "Secure access to wishes from chains"
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
        OR (star_chains.is_opened = true AND star_chains.opened_at > now() - interval '2 minutes')
      )
      AND star_chains.created_at > now() - interval '30 days'
    )
  );

-- 为wishes表创建安全策略
CREATE POLICY "Secure access to wishes through chains"
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
        OR (star_chains.is_opened = true AND star_chains.opened_at > now() - interval '2 minutes')
      )
      AND star_chains.created_at > now() - interval '30 days'
    )
  );

-- 为users表创建安全策略
CREATE POLICY "Secure access to creator info through chains"
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
        OR (star_chains.is_opened = true AND star_chains.opened_at > now() - interval '2 minutes')
      )
      AND star_chains.created_at > now() - interval '30 days'
    )
  );

-- 添加速率限制函数（可选）
CREATE OR REPLACE FUNCTION check_access_rate_limit(user_ip text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  access_count integer;
BEGIN
  -- 检查过去1小时内从同一IP的访问次数
  SELECT COUNT(*) INTO access_count
  FROM blind_box_opens
  WHERE ip_hash = user_ip
  AND opened_at > now() - interval '1 hour';
  
  -- 如果超过100次访问，拒绝
  RETURN access_count < 100;
END;
$$;

COMMENT ON POLICY "Secure access to star chains" ON star_chains IS 
'Enhanced security policy with time limits and optional rate limiting';