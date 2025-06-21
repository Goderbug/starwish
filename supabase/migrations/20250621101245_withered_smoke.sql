/*
  # 简化星链访问策略

  1. 策略更新
    - 删除复杂的时间窗口检查策略
    - 创建简化的公共访问策略
    - 移除并发冲突的可能性

  2. 安全性
    - 保持基本的RLS保护
    - 简化权限检查逻辑
    - 允许公共访问活跃的星链

  3. 性能优化
    - 减少复杂的子查询
    - 简化策略条件
    - 提高查询效率
*/

-- 删除所有现有的复杂策略
DROP POLICY IF EXISTS "Anyone can read accessible star chains" ON star_chains;
DROP POLICY IF EXISTS "Anyone can read wishes from accessible chains" ON star_chain_wishes;
DROP POLICY IF EXISTS "Anyone can read wishes through accessible chains" ON wishes;
DROP POLICY IF EXISTS "Anyone can read creator info through accessible chains" ON users;

-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "Public can access active star chains" ON star_chains;
DROP POLICY IF EXISTS "Public can access wishes from active chains" ON star_chain_wishes;
DROP POLICY IF EXISTS "Public can read wishes through active chains" ON wishes;
DROP POLICY IF EXISTS "Public can read creator info through active chains" ON users;

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

-- 处理blind_box_opens表的策略
DROP POLICY IF EXISTS "Anyone can record opens" ON blind_box_opens;
DROP POLICY IF EXISTS "Public can record opens" ON blind_box_opens;
DROP POLICY IF EXISTS "Creators can read their chain opens" ON blind_box_opens;

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
DROP POLICY IF EXISTS "Public can insert opened wishes" ON user_opened_wishes;
DROP POLICY IF EXISTS "Public can read opened wishes" ON user_opened_wishes;
DROP POLICY IF EXISTS "Public can update opened wishes" ON user_opened_wishes;
DROP POLICY IF EXISTS "Public can delete opened wishes" ON user_opened_wishes;

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