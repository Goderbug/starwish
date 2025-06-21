/*
  # 修复星链访问策略以解决开启失败问题

  1. 问题分析
    - 当前RLS策略只允许访问未开启的星链
    - 当星链被标记为已开启后，立即无法访问
    - 这导致开启过程中的数据库操作失败

  2. 解决方案
    - 允许访问刚开启的星链（5分钟内）
    - 确保开启过程能够完整执行
    - 保持安全性的同时提供必要的访问窗口

  3. 修改内容
    - 更新所有相关表的RLS策略
    - 添加时间窗口允许访问刚开启的星链
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
    -- 关键修复：允许访问未开启的星链，或者刚开启不久的星链（5分钟内）
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
'Allows public access to active star chains that are either unopened or recently opened (within 5 minutes) to prevent race conditions during opening process';

COMMENT ON POLICY "Public can read wishes from active chains" ON star_chain_wishes IS 
'Allows access to wishes through active star chains, including recently opened ones to complete the opening process';

COMMENT ON POLICY "Public can read wishes through active chains" ON wishes IS 
'Allows reading wish content through active star chains, including recently opened ones for proper completion';

COMMENT ON POLICY "Public can read creator info through active chains" ON users IS 
'Allows reading creator information through active star chains, including recently opened ones for display purposes';