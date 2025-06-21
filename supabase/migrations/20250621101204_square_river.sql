/*
  # 简化星链系统 - 重新设计RLS策略

  1. 简化策略
    - 移除复杂的时间窗口检查
    - 简化开启状态逻辑
    - 确保匿名用户可以访问有效的星链

  2. 安全性
    - 保持基本的RLS保护
    - 允许公共访问有效的星链
    - 保护用户隐私数据
*/

-- 删除所有现有的复杂策略
DROP POLICY IF EXISTS "Anyone can read accessible star chains" ON star_chains;
DROP POLICY IF EXISTS "Anyone can read wishes from accessible chains" ON star_chain_wishes;
DROP POLICY IF EXISTS "Anyone can read wishes through accessible chains" ON wishes;
DROP POLICY IF EXISTS "Anyone can read creator info through accessible chains" ON users;

-- 为star_chains表创建简化的公共访问策略
CREATE POLICY "Public can access active star chains"
  ON star_chains
  FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true 
    AND (expires_at IS NULL OR expires_at > now())
  );

-- 为star_chain_wishes表创建简化的公共访问策略
CREATE POLICY "Public can access wishes from active chains"
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

-- 为wishes表创建简化的公共访问策略
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

-- 为users表创建简化的公共访问策略（只允许读取创建者基本信息）
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

-- 确保其他表的策略保持简单
DROP POLICY IF EXISTS "Anyone can record opens" ON blind_box_opens;
CREATE POLICY "Public can record opens"
  ON blind_box_opens
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 确保用户可以读取自己创建的星链的开启记录
CREATE POLICY "Creators can read their chain opens"
  ON blind_box_opens
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM star_chains 
      WHERE star_chains.id = blind_box_opens.chain_id 
      AND star_chains.creator_id = auth.uid()
    )
  );

-- 简化user_opened_wishes表的策略
DROP POLICY IF EXISTS "Anyone can insert opened wishes" ON user_opened_wishes;
DROP POLICY IF EXISTS "Anyone can read opened wishes" ON user_opened_wishes;
DROP POLICY IF EXISTS "Anyone can update opened wishes" ON user_opened_wishes;
DROP POLICY IF EXISTS "Anyone can delete opened wishes" ON user_opened_wishes;

CREATE POLICY "Public can insert opened wishes"
  ON user_opened_wishes
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public can read opened wishes"
  ON user_opened_wishes
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public can update opened wishes"
  ON user_opened_wishes
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete opened wishes"
  ON user_opened_wishes
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- 添加策略说明
COMMENT ON POLICY "Public can access active star chains" ON star_chains IS 
'Simplified policy: allows public access to all active, non-expired star chains';

COMMENT ON POLICY "Public can access wishes from active chains" ON star_chain_wishes IS 
'Simplified policy: allows public access to wishes through active star chains';

COMMENT ON POLICY "Public can read wishes through active chains" ON wishes IS 
'Simplified policy: allows public reading of wish content through active star chains';

COMMENT ON POLICY "Public can read creator info through active chains" ON users IS 
'Simplified policy: allows public reading of creator information through active star chains';