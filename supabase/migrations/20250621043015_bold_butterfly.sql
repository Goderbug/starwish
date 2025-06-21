/*
  # 修复星链开启的RLS策略问题

  1. 问题分析
    - 当用户开启盲盒时，星链状态被标记为已开启
    - 但RLS策略只允许访问未开启的星链
    - 这导致开启过程中无法完成后续的数据库操作

  2. 解决方案
    - 允许访问未开启的星链
    - 允许访问刚开启不久的星链（5分钟内）
    - 这样可以完成整个开启流程而不会被RLS阻止

  3. 安全性
    - 5分钟的窗口期足够完成开启流程
    - 超过5分钟后星链将不再可访问，保持一次性使用的特性
*/

-- 安全地删除现有策略（使用DO块避免策略不存在的错误）
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- 删除star_chains表的相关策略
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'star_chains' 
        AND schemaname = 'public'
        AND (policyname LIKE '%can read%star chains%' OR policyname LIKE '%can read%active%')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON star_chains', policy_record.policyname);
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;

    -- 删除star_chain_wishes表的相关策略
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'star_chain_wishes' 
        AND schemaname = 'public'
        AND (policyname LIKE '%can read%chains%' OR policyname LIKE '%wishes%chains%')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON star_chain_wishes', policy_record.policyname);
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;

    -- 删除wishes表的相关策略
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'wishes' 
        AND schemaname = 'public'
        AND (policyname LIKE '%can read%chains%' OR policyname LIKE '%through%chains%')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON wishes', policy_record.policyname);
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;

    -- 删除users表的相关策略
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'users' 
        AND schemaname = 'public'
        AND (policyname LIKE '%can read%chains%' OR policyname LIKE '%creator%chains%')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON users', policy_record.policyname);
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
END $$;

-- 为star_chains表创建新策略 - 关键修复：允许访问刚开启的星链
CREATE POLICY "Allow access to active star chains"
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

-- 为star_chain_wishes表创建新策略
CREATE POLICY "Allow access to wishes from accessible chains"
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

-- 为wishes表创建新策略
CREATE POLICY "Allow reading wishes through accessible chains"
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

-- 为users表创建新策略
CREATE POLICY "Allow reading creator info through accessible chains"
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

-- 添加详细的策略说明
COMMENT ON POLICY "Allow access to active star chains" ON star_chains IS 
'Allows public access to active star chains that are either unopened or recently opened (within 5 minutes) to prevent race conditions during the opening process';

COMMENT ON POLICY "Allow access to wishes from accessible chains" ON star_chain_wishes IS 
'Allows access to wishes through active star chains, including recently opened ones to complete the opening process';

COMMENT ON POLICY "Allow reading wishes through accessible chains" ON wishes IS 
'Allows reading wish content through active star chains, including recently opened ones for proper completion';

COMMENT ON POLICY "Allow reading creator info through accessible chains" ON users IS 
'Allows reading creator information through active star chains, including recently opened ones for display purposes';

-- 记录修复完成
DO $$
BEGIN
    RAISE NOTICE '=== 星链RLS策略修复完成 ===';
    RAISE NOTICE '修复内容：';
    RAISE NOTICE '1. 允许访问未开启的活跃星链';
    RAISE NOTICE '2. 允许访问刚开启的星链（5分钟内）';
    RAISE NOTICE '3. 解决了开启过程中的竞态条件问题';
    RAISE NOTICE '4. 保持了一次性使用的安全特性';
END $$;