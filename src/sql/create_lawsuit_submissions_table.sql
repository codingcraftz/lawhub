-- 소송 송달 및 제출 내역 테이블 생성
CREATE TABLE IF NOT EXISTS test_lawsuit_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lawsuit_id UUID REFERENCES test_case_lawsuits(id) ON DELETE CASCADE,
  submission_type VARCHAR(50) NOT NULL, -- '송달문서', '제출문서'
  document_type VARCHAR(100) NOT NULL, -- '소장', '답변서', '준비서면', '결정문', '판결문' 등
  submission_date DATE NOT NULL,
  from_entity VARCHAR(100) NOT NULL, -- 발신 주체 (법원, 본인, 상대방 등)
  to_entity VARCHAR(100) NOT NULL, -- 수신 주체 (법원, 본인, 상대방 등)
  description TEXT,
  file_url TEXT,
  related_docs TEXT[],
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_lawsuit_submissions_lawsuit_id ON test_lawsuit_submissions(lawsuit_id);
CREATE INDEX IF NOT EXISTS idx_lawsuit_submissions_submission_type ON test_lawsuit_submissions(submission_type);
CREATE INDEX IF NOT EXISTS idx_lawsuit_submissions_submission_date ON test_lawsuit_submissions(submission_date);

-- 발신/수신 엔티티 유형 제약 설정
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'entity_type') THEN
    CREATE TYPE entity_type AS ENUM ('법원', '본인', '상대방', '제3자');
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END$$;

-- 테이블 주석 추가
COMMENT ON TABLE test_lawsuit_submissions IS '소송 관련 송달 및 제출 문서 내역을 저장하는 테이블';
COMMENT ON COLUMN test_lawsuit_submissions.submission_type IS '문서 유형 (송달문서: 법원이나 상대방으로부터 받은 문서, 제출문서: 법원이나 상대방에게 제출한 문서)';
COMMENT ON COLUMN test_lawsuit_submissions.document_type IS '세부 문서 유형 (소장, 답변서, 준비서면, 결정문, 판결문 등)';
COMMENT ON COLUMN test_lawsuit_submissions.from_entity IS '문서 발신 주체 (법원, 본인, 상대방 등)';
COMMENT ON COLUMN test_lawsuit_submissions.to_entity IS '문서 수신 주체 (법원, 본인, 상대방 등)';
COMMENT ON COLUMN test_lawsuit_submissions.related_docs IS '관련된 다른 문서의 ID 배열 (선택사항)'; 