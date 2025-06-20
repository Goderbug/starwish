/*
  # 修复盲盒开启后链接失效问题

  1. 问题分析
    - 当前RLS策略允许访问已开启的星链
    - 需要修改策略，确保已开启的星链无法被再次访问
    - 只有未开启且活跃的星链才能被访问

  2. 解决方案
    - 修改star_chains的RLS策略，添加is_opened = false条件
    - 修改相关联表的策略，确保一致性
    - 确保已开启的盲盒真正失效
*/

-- 删除现有的策略
DROP POLICY IF EXISTS "Public can read active star chains" ON star_chains;
DROP POLICY IF EXISTS "Public can read wishes from active chains" ON star_chain_wishes;
DROP POLICY IF EXISTS "Public can read wishes through active chains" ON wishes;
DROP POLICY IF EXISTS "Public can read creator info through active chains" ON users;

-- 为star_chains表创建新的策略 - 只允许访问未开启且活跃的星链
CREATE POLICY "Public can read unopened active star chains"
  ON star_chains
  FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true 
    AND is_opened = false  -- 关键修复：只允许访问未开启的星链
    AND (expires_at IS NULL OR expires_at > now())
  );

-- 为star_chain_wishes表创建新的策略 - 只允许通过未开启的活跃星链访问
CREATE POLICY "Public can read wishes from unopened active chains"
  ON star_chain_wishes
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM star_chains 
      WHERE star_chains.id = star_chain_wishes.chain_id 
      AND star_chains.is_active = true 
      AND star_chains.is_opened = false  -- 关键修复：只允许未开启的星链
      AND (star_chains.expires_at IS NULL OR star_chains.expires_at > now())
    )
  );

-- 为wishes表创建新的策略 - 只允许通过未开启的活跃星链访问星愿内容
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
      AND star_chains.is_opened = false  -- 关键修复：只允许未开启的星链
      AND (star_chains.expires_at IS NULL OR star_chains.expires_at > now())
    )
  );

-- 为users表创建新的策略 - 只允许通过未开启的活跃星链访问创建者信息
CREATE POLICY "Public can read creator info through unopened active chains"
  ON users
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM star_chains 
      WHERE star_chains.creator_id = users.id
      AND star_chains.is_active = true 
      AND star_chains.is_opened = false  -- 关键修复：只允许未开启的星链
      AND (star_chains.expires_at IS NULL OR star_chains.expires_at > now())
    )
  );

-- 添加说明注释
COMMENT ON POLICY "Public can read unopened active star chains" ON star_chains IS 
'Allows public access to star chains that are active, not yet opened, and not expired';

COMMENT ON POLICY "Public can read wishes from unopened active chains" ON star_chain_wishes IS 
'Allows access to wishes only through unopened active star chains';

COMMENT ON POLICY "Public can read wishes through unopened active chains" ON wishes IS 
'Allows reading wish content only through unopened active star chains';

COMMENT ON POLICY "Public can read creator info through unopened active chains" ON users IS 
'Allows reading creator information only through unopened active star chains';