-- pgvector 확장 설치 (이미 설치되어 있을 수 있음)
CREATE EXTENSION IF NOT EXISTS vector;

-- 대화 세션 테이블 (이미 생성되어 있을 수 있음)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RAG 메시지 테이블 (외래키 제약조건 추가)
CREATE TABLE IF NOT EXISTS rag_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  embedding VECTOR(1536), -- OpenAI ada-002 임베딩 모델 사용
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (검색 성능 향상을 위해)
CREATE INDEX IF NOT EXISTS idx_rag_messages_conversation_id ON rag_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_rag_messages_user_id ON rag_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);

-- 벡터 검색을 위한 최적화된 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_rag_messages_embedding ON rag_messages USING ivfflat (embedding vector_cosine_ops);

-- 벡터 검색 함수 수정 (rag_messages 테이블 사용)
CREATE OR REPLACE FUNCTION match_rag_messages(
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  role TEXT,
  conversation_id UUID,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    rm.id,
    rm.content,
    rm.role,
    rm.conversation_id,
    1 - (rm.embedding <=> query_embedding) AS similarity
  FROM rag_messages rm
  WHERE 1 - (rm.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- RLS 정책 설정 (선택사항)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_messages ENABLE ROW LEVEL SECURITY;

-- 모든 사용자에게 읽기/쓰기 권한 부여 (테스트 목적)
CREATE POLICY "Allow full access to everyone" ON conversations
  USING (true) WITH CHECK (true);
  
CREATE POLICY "Allow full access to everyone" ON rag_messages
  USING (true) WITH CHECK (true); 