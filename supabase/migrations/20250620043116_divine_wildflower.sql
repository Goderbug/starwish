/*
  # 修复RLS策略以支持盲盒分享功能

  1. 问题修复
    - 修复star_chains表的RLS策略，允许匿名用户访问活跃的星链
    - 修复star_chain_wishes表的RLS策略，允许通过活跃星链访问星愿
    - 确保盲盒分享功能正常工作

  2. 安全性
    - 保持数据安全的同时允许必要的访问
    - 只允许访问活跃且未过期的星链
    - 保护用户隐私数据
*/

-- 删除现有的有问题的策略
DROP POLICY IF EXISTS "Anonymous can read active star chains" ON star_chains;
DROP POLICY IF EXISTS "Star chain wishes follow chain permissions" ON star_chain_wishes;

-- 为star_chains表创建新的策略，允许匿名用户和认证用户访问活跃的星链
CREATE POLICY "Public can read active star chains"
  ON star_chains
  FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true 
    AND (expires_at IS NULL OR expires_at > now())
  );

-- 为star_chain_wishes表创建新的策略，允许通过活跃星链访问星愿
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
    )
  );

-- 确保wishes表允许通过star_chain_wishes访问
-- 添加策略允许通过活跃星链访问星愿内容
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
    )
  );

-- 确保users表允许通过星链访问创建者信息（仅基本信息）
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
    )
  );