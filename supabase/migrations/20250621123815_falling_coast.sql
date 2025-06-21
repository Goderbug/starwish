-- 修复盲盒重复开启问题：严格限制已开启星链的访问

-- 删除过于宽松的策略
DROP POLICY IF EXISTS "Public can access active star chains" ON star_chains;
DROP POLICY IF EXISTS "Public can access wishes from active chains" ON star_chain_wishes;
DROP POLICY IF EXISTS "Public can read wishes through active chains" ON wishes;
DROP POLICY IF EXISTS "Public can read creator info through active chains" ON users;

-- 为star_chains表创建严格的访问策略
CREATE POLICY "Public can access unopened active star chains"
  ON star_chains
  FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true 
    AND (expires_at IS NULL OR expires_at > now())
    AND (
      -- 只允许访问未开启的星链
      is_opened = false
      -- 或者刚开启不超过2分钟的星链（用于完成开启流程和显示结果）
      OR (is_opened = true AND opened_at > now() - interval '2 minutes')
    )
  );

-- 为star_chain_wishes表创建对应的访问策略
CREATE POLICY "Public can access wishes from unopened active chains"
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
    )
  );

-- 为wishes表创建对应的访问策略
CREATE POLICY "Public can read wishes through unopened active chains"
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
    )
  );

-- 为users表创建对应的访问策略
CREATE POLICY "Public can read creator info through unopened active chains"
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
    )
  );

-- 添加策略说明
COMMENT ON POLICY "Public can access unopened active star chains" ON star_chains IS 
'Strict policy: only allows access to unopened star chains or recently opened ones (within 2 minutes for completion flow)';

COMMENT ON POLICY "Public can access wishes from unopened active chains" ON star_chain_wishes IS 
'Strict policy: only allows access to wishes through unopened or recently opened star chains';

COMMENT ON POLICY "Public can read wishes through unopened active chains" ON wishes IS 
'Strict policy: only allows reading wish content through unopened or recently opened star chains';

COMMENT ON POLICY "Public can read creator info through unopened active chains" ON users IS 
'Strict policy: only allows reading creator info through unopened or recently opened star chains';