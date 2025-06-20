/*
  # 修复盲盒认证逻辑

  1. 更新说明
    - 修改 user_opened_wishes 表的 user_fingerprint 字段说明
    - 现在使用用户ID而不是浏览器指纹来标识用户
    - 确保只有登录用户才能开启盲盒

  2. 数据迁移
    - 保持现有数据结构不变
    - 新的开启记录将使用用户ID作为标识

  3. 安全性
    - 盲盒开启后立即失效，防止重复开启
    - 使用用户ID确保盲盒归属明确
*/

-- 添加注释说明字段用途的变化
COMMENT ON COLUMN user_opened_wishes.user_fingerprint IS 'User identifier - now uses user ID for authenticated users, fingerprint for legacy anonymous users';

-- 添加注释说明字段用途的变化
COMMENT ON COLUMN blind_box_opens.opener_fingerprint IS 'Opener identifier - now uses user ID for authenticated users, fingerprint for legacy anonymous users';

-- 添加注释说明字段用途的变化  
COMMENT ON COLUMN star_chains.opener_fingerprint IS 'Opener identifier - now uses user ID for authenticated users, fingerprint for legacy anonymous users';

-- 创建索引以提高查询性能（如果不存在）
CREATE INDEX IF NOT EXISTS idx_user_opened_wishes_user_fingerprint_opened_at 
ON user_opened_wishes(user_fingerprint, opened_at DESC);

-- 添加说明注释
COMMENT ON TABLE user_opened_wishes IS 'Records of wishes opened by users - now requires authentication for new entries';
COMMENT ON TABLE blind_box_opens IS 'Anonymous opening records for statistics - now uses user ID for authenticated users';
COMMENT ON TABLE star_chains IS 'Shareable wish collections - now tracks authenticated opener';