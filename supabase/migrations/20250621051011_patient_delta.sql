/*
  # 修复公共访问星链的RLS策略

  ## 问题分析
  当前的RLS策略可能过于严格，导致非创建者无法访问星链。
  需要确保匿名用户和其他认证用户都能访问活跃的星链。

  ## 修复内容
  1. 重新创建更宽松的公共访问策略
  2. 确保匿名用户可以读取活跃星链
  3. 允许在开启过程中的短时间访问
*/

-- 首先删除所有可能冲突的策略
DROP POLICY IF EXISTS "Public can read active star chains" ON star_chains;
DROP POLICY IF EXISTS "Public can read wishes from active chains" ON star_chain_wishes;
DROP POLICY IF EXISTS "Public can read wishes through active chains" ON wishes;
DROP POLICY IF EXISTS "Public can read creator info through active chains" ON users;

-- 删除旧的限制性策略
DROP POLICY IF EXISTS "Allow access to active star chains" ON star_chains;
DROP POLICY IF EXISTS "Allow access to wishes from accessible chains" ON star_chain_wishes;
DROP POLICY IF EXISTS "Allow reading wishes through accessible chains" ON wishes;
DROP POLICY IF EXISTS "Allow reading creator info through accessible chains" ON users;

-- 为star_chains表创建公共访问策略
CREATE POLICY "Anyone can read accessible star chains"
  ON star_chains
  FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true 
    AND (expires_at IS NULL OR expires_at > now())
    AND (
      -- 未开启的星链可以访问
      is_opened = false 
      -- 或者刚开启不久的星链（5分钟内）也可以访问，用于完成开启流程
      OR (is_opened = true AND opened_at > now() - interval '5 minutes')
    )
  );

-- 为star_chain_wishes表创建公共访问策略
CREATE POLICY "Anyone can read wishes from accessible chains"
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

-- 为wishes表创建公共访问策略
CREATE POLICY "Anyone can read wishes through accessible chains"
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

-- 为users表创建公共访问策略
CREATE POLICY "Anyone can read creator info through accessible chains"
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

-- 确保blind_box_opens表的策略允许匿名用户插入记录
DROP POLICY IF EXISTS "Anonymous can record opens" ON blind_box_opens;
CREATE POLICY "Anyone can record opens"
  ON blind_box_opens
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 确保user_opened_wishes表的策略允许匿名和认证用户操作
DROP POLICY IF EXISTS "Users can insert opened wishes" ON user_opened_wishes;
DROP POLICY IF EXISTS "Users can read opened wishes" ON user_opened_wishes;
DROP POLICY IF EXISTS "Users can update opened wishes" ON user_opened_wishes;
DROP POLICY IF EXISTS "Users can delete opened wishes" ON user_opened_wishes;

CREATE POLICY "Anyone can insert opened wishes"
  ON user_opened_wishes
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read opened wishes"
  ON user_opened_wishes
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can update opened wishes"
  ON user_opened_wishes
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete opened wishes"
  ON user_opened_wishes
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- 添加策略说明
COMMENT ON POLICY "Anyone can read accessible star chains" ON star_chains IS 
'Allows public access to active star chains that are either unopened or recently opened (within 5 minutes)';

COMMENT ON POLICY "Anyone can read wishes from accessible chains" ON star_chain_wishes IS 
'Allows public access to wishes through accessible star chains';

COMMENT ON POLICY "Anyone can read wishes through accessible chains" ON wishes IS 
'Allows public reading of wish content through accessible star chains';

COMMENT ON POLICY "Anyone can read creator info through accessible chains" ON users IS 
'Allows public reading of creator information through accessible star chains';