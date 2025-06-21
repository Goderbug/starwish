-- 修复盲盒开启问题：简化权限策略，确保开启流程正常工作

-- 删除过于严格的策略
DROP POLICY IF EXISTS "Public can access unopened active star chains" ON star_chains;
DROP POLICY IF EXISTS "Public can access wishes from unopened active chains" ON star_chain_wishes;
DROP POLICY IF EXISTS "Public can read wishes through unopened active chains" ON wishes;
DROP POLICY IF EXISTS "Public can read creator info through unopened active chains" ON users;

-- 为star_chains表创建更宽松的访问策略
CREATE POLICY "Public can access active star chains"
  ON star_chains
  FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true 
    AND (expires_at IS NULL OR expires_at > now())
  );

-- 为star_chain_wishes表创建对应的访问策略
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

-- 为wishes表创建对应的访问策略
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

-- 为users表创建对应的访问策略
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

-- 确保star_chains表的更新策略允许认证用户更新自己创建的星链
DROP POLICY IF EXISTS "Users can update own star chains" ON star_chains;
CREATE POLICY "Users can update own star chains"
  ON star_chains
  FOR UPDATE
  TO authenticated
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

-- 确保认证用户可以更新任何星链的开启状态（用于盲盒开启）
CREATE POLICY "Authenticated users can open star chains"
  ON star_chains
  FOR UPDATE
  TO authenticated
  USING (
    is_active = true 
    AND (expires_at IS NULL OR expires_at > now())
    AND is_opened = false
  )
  WITH CHECK (
    is_active = true 
    AND (expires_at IS NULL OR expires_at > now())
  );

-- 确保blind_box_opens和user_opened_wishes表的策略正确
DROP POLICY IF EXISTS "Public can record opens" ON blind_box_opens;
CREATE POLICY "Public can record opens"
  ON blind_box_opens
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 添加策略说明
COMMENT ON POLICY "Public can access active star chains" ON star_chains IS 
'Allows public access to all active, non-expired star chains for blind box functionality';

COMMENT ON POLICY "Users can update own star chains" ON star_chains IS 
'Allows users to update star chains they created';

COMMENT ON POLICY "Authenticated users can open star chains" ON star_chains IS 
'Allows authenticated users to open unopened active star chains';