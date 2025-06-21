/*
  # 修复星链访问策略

  1. 问题分析
    - 当前RLS策略只允许访问未开启的星链
    - 这导致已开启的星链无法被访问，显示为"已失效"
    - 需要允许在开启过程中访问星链数据

  2. 解决方案
    - 修改策略允许在特定条件下访问已开启的星链
    - 保持安全性的同时允许正常的开启流程
*/

-- 删除现有的限制性策略
DROP POLICY IF EXISTS "Public can read unopened active star chains" ON star_chains;
DROP POLICY IF EXISTS "Public can read wishes from unopened active chains" ON star_chain_wishes;
DROP POLICY IF EXISTS "Public can read wishes through unopened active chains" ON wishes;
DROP POLICY IF EXISTS "Public can read creator info through unopened active chains" ON users;

-- 为star_chains表创建新的策略 - 允许访问活跃的星链（包括刚开启的）
CREATE POLICY "Public can read active star chains"
  ON star_chains
  FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true 
    AND (expires_at IS NULL OR expires_at > now())
    -- 允许访问未开启的星链，或者刚开启不久的星链（5分钟内）
    AND (
      is_opened = false 
      OR (is_opened = true AND opened_at > now() - interval '5 minutes')
    )
  );

-- 为star_chain_wishes表创建新的策略
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

-- 为wishes表创建新的策略
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

-- 为users表创建新的策略
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

-- 添加说明注释
COMMENT ON POLICY "Public can read active star chains" ON star_chains IS 
'Allows public access to active star chains that are either unopened or recently opened (within 5 minutes)';

COMMENT ON POLICY "Public can read wishes from active chains" ON star_chain_wishes IS 
'Allows access to wishes through active star chains, including recently opened ones';

COMMENT ON POLICY "Public can read wishes through active chains" ON wishes IS 
'Allows reading wish content through active star chains, including recently opened ones';

COMMENT ON POLICY "Public can read creator info through active chains" ON users IS 
'Allows reading creator information through active star chains, including recently opened ones';