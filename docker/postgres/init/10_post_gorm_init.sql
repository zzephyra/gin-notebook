-- ===========================================
-- post_gorm_init.sql  (no CREATE TABLE)
-- 仅做：扩展 / 列补齐 / 触发器 / 索引 / RLS
-- 自动：若可用 zhparser -> 中英双 tsvector；否则 -> 英文 tsv + 中文 trigram
-- ===========================================

-- 0) 基本扩展（幂等）
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 尝试“无报错”安装 zhparser：仅当服务器可用该扩展时才装
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name='zhparser')
     AND NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname='zhparser') THEN
    EXECUTE 'CREATE EXTENSION zhparser';
  END IF;
END $$;

-- 1) 清理你旧版的单列 tsv 架构（如果存在）
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'rag_chunks_tsv_trigger') THEN
    DROP TRIGGER rag_chunks_tsv_trigger ON rag_chunks;
  END IF;
END $$;
DROP FUNCTION IF EXISTS rag_update_tsv() CASCADE;
DROP INDEX IF EXISTS idx_chunk_tsv;
ALTER TABLE rag_chunks DROP COLUMN IF EXISTS tsv;

-- 2) 列补齐：始终添加英文 tsv_en；若后续启用 zhparser 会再加 tsv_zh
ALTER TABLE rag_chunks
  ADD COLUMN IF NOT EXISTS tsv_en tsvector;

-- 3) 触发器函数（根据 zhparser 是否安装走不同实现）
-- 3.1 英文专用
CREATE OR REPLACE FUNCTION rag_update_tsv_en() RETURNS trigger AS $$
BEGIN
  NEW.tsv_en := to_tsvector('english', unaccent(coalesce(NEW.text, '')));
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- 3.2 若 zhparser 已安装，创建中文配置与双语函数
DO $outer$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname='zhparser') THEN
    -- 中文分词配置 zh（仅首次创建）
    IF NOT EXISTS (SELECT 1 FROM pg_ts_config WHERE cfgname='zh') THEN
      CREATE TEXT SEARCH CONFIGURATION zh (PARSER = zhparser);
      -- 把常见词性映射到 simple（可按需调整）
      ALTER TEXT SEARCH CONFIGURATION zh ADD MAPPING FOR n, v, a, i, e, l WITH simple;
    END IF;

    -- 为 rag_chunks 加中文列
    ALTER TABLE rag_chunks
      ADD COLUMN IF NOT EXISTS tsv_zh tsvector;

    -- 双语触发器函数：同时维护 tsv_en / tsv_zh
    CREATE OR REPLACE FUNCTION rag_update_tsv_bilingual() RETURNS trigger AS $fn$
    BEGIN
      NEW.tsv_en := to_tsvector('english', unaccent(coalesce(NEW.text, '')));
      NEW.tsv_zh := to_tsvector('zh',       coalesce(NEW.text, ''));
      RETURN NEW;
    END
    $fn$ LANGUAGE plpgsql;
  END IF;
END
$outer$;

-- 4) 创建触发器（根据 zhparser 是否存在选择双语或仅英文）
DO $$
BEGIN
  -- 先删旧的可能重名触发器
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'rag_chunks_tsv_bi_trg') THEN
    DROP TRIGGER rag_chunks_tsv_bi_trg ON rag_chunks;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'rag_chunks_tsv_en_trg') THEN
    DROP TRIGGER rag_chunks_tsv_en_trg ON rag_chunks;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname='zhparser') THEN
    CREATE TRIGGER rag_chunks_tsv_bi_trg
    BEFORE INSERT OR UPDATE OF text ON rag_chunks
    FOR EACH ROW EXECUTE FUNCTION rag_update_tsv_bilingual();
  ELSE
    CREATE TRIGGER rag_chunks_tsv_en_trg
    BEFORE INSERT OR UPDATE OF text ON rag_chunks
    FOR EACH ROW EXECUTE FUNCTION rag_update_tsv_en();
  END IF;
END $$;

-- 5) 索引
-- 5.1 常用过滤列（保留你原有）
CREATE INDEX IF NOT EXISTS idx_doc_ws_owner     ON rag_documents (workspace_id, owner_user_id);
CREATE INDEX IF NOT EXISTS idx_doc_visibility   ON rag_documents (visibility);
CREATE INDEX IF NOT EXISTS idx_chunk_ws_owner   ON rag_chunks (workspace_id, owner_user_id);
CREATE INDEX IF NOT EXISTS idx_chunk_visibility ON rag_chunks (visibility);
CREATE INDEX IF NOT EXISTS idx_chunk_docid_idx  ON rag_chunks (document_id, idx);

-- 5.2 关键词检索索引
-- 英文 tsv 索引
CREATE INDEX IF NOT EXISTS idx_chunk_tsv_en ON rag_chunks USING GIN (tsv_en);

-- 中文分词可用：建 tsv_zh 索引；否则：对 text 列建 trigram 索引
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname='zhparser') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_chunk_tsv_zh') THEN
      CREATE INDEX idx_chunk_tsv_zh ON rag_chunks USING GIN (tsv_zh);
    END IF;
  ELSE
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_chunk_trgm') THEN
      CREATE INDEX idx_chunk_trgm ON rag_chunks USING GIN (text gin_trgm_ops);
    END IF;
  END IF;
END $$;

-- 5.3 语义向量近邻（pgvector）
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_chunk_ivf') THEN
    CREATE INDEX idx_chunk_ivf ON rag_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
  END IF;
END $$;

-- 6) RLS 开启
ALTER TABLE rag_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_chunks    ENABLE ROW LEVEL SECURITY;

-- 6.1 读策略（DROP + CREATE 兼容老版本）
DROP POLICY IF EXISTS rag_documents_read ON rag_documents;
CREATE POLICY rag_documents_read ON rag_documents
USING (
  (owner_user_id = current_setting('app.user_id', true)::bigint AND visibility IN ('private','workspace','public'))
  OR (visibility = 'workspace' AND workspace_id = current_setting('app.workspace_id', true)::bigint)
  OR (visibility = 'public')
);

DROP POLICY IF EXISTS rag_chunks_read ON rag_chunks;
CREATE POLICY rag_chunks_read ON rag_chunks
USING (
  (owner_user_id = current_setting('app.user_id', true)::bigint AND visibility IN ('private','workspace','public'))
  OR (visibility = 'workspace' AND workspace_id = current_setting('app.workspace_id', true)::bigint)
  OR (visibility = 'public')
);

-- 6.2 写策略（INSERT 约束）
DROP POLICY IF EXISTS rag_documents_write ON rag_documents;
CREATE POLICY rag_documents_write ON rag_documents
FOR INSERT WITH CHECK (
  owner_user_id = current_setting('app.user_id', true)::bigint
  AND workspace_id = current_setting('app.workspace_id', true)::bigint
);

DROP POLICY IF EXISTS rag_chunks_write ON rag_chunks;
CREATE POLICY rag_chunks_write ON rag_chunks
FOR INSERT WITH CHECK (
  owner_user_id = current_setting('app.user_id', true)::bigint
  AND workspace_id = current_setting('app.workspace_id', true)::bigint
);


-- 6.3 文档→块 冗余同步（无外键）
-- a) rag_chunks 的 UPDATE 策略（触发器需要能更新）
--    与你的 INSERT 策略一致：同 owner + 同 workspace 才允许
DROP POLICY IF EXISTS rag_chunks_update ON rag_chunks;
CREATE POLICY rag_chunks_update ON rag_chunks
FOR UPDATE USING (
  owner_user_id = current_setting('app.user_id', true)::bigint
  AND workspace_id = current_setting('app.workspace_id', true)::bigint
);

-- b) 触发器函数：当 rag_documents 的核心字段变化，同步到 rag_chunks
CREATE OR REPLACE FUNCTION sync_chunk_from_document() RETURNS trigger AS $$
BEGIN
  UPDATE rag_chunks AS c
     SET visibility     = NEW.visibility,
         doc_title      = NEW.title,
         doc_is_active  = NEW.is_active,
         doc_deleted_at = NEW.deleted_at
   WHERE c.document_id = NEW.id
     AND (
       c.visibility     IS DISTINCT FROM NEW.visibility OR
       c.doc_title      IS DISTINCT FROM NEW.title      OR
       c.doc_is_active  IS DISTINCT FROM NEW.is_active  OR
       c.doc_deleted_at IS DISTINCT FROM NEW.deleted_at
     );
  RETURN NEW;
END $$ LANGUAGE plpgsql;

-- c) 触发器（仅在关键列变更时触发）
DROP TRIGGER IF EXISTS trg_sync_chunk_from_document ON rag_documents;
CREATE TRIGGER trg_sync_chunk_from_document
AFTER UPDATE OF visibility, title, is_active, deleted_at ON rag_documents
FOR EACH ROW EXECUTE FUNCTION sync_chunk_from_document();

-- d) 一次性历史回填（让现有 chunks 立即拥有文档冗余字段）
--    注意：这条在数据量大时建议分批执行
UPDATE rag_chunks AS c
SET
  visibility     = d.visibility,
  doc_title      = d.title,
  doc_is_active  = d.is_active,
  doc_deleted_at = d.deleted_at
FROM rag_documents AS d
WHERE c.document_id = d.id
  AND (
    c.visibility     IS DISTINCT FROM d.visibility OR
    c.doc_title      IS DISTINCT FROM d.title      OR
    c.doc_is_active  IS DISTINCT FROM d.is_active  OR
    c.doc_deleted_at IS DISTINCT FROM d.deleted_at
  );

-- 7)（可选）统计信息
ANALYZE rag_chunks;
