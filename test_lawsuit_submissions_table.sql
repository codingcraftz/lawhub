-- test_lawsuit_submissions 테이블 생성
CREATE TABLE IF NOT EXISTS test_lawsuit_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lawsuit_id UUID NOT NULL REFERENCES test_case_lawsuits(id) ON DELETE CASCADE,
  submission_type VARCHAR NOT NULL, -- '송달문서' 또는 '제출문서'
  document_type VARCHAR NOT NULL, -- 문서 유형 (소장, 답변서, 준비서면, 결정문, 판결문 등)
  submission_date DATE, -- 송달/제출일
  description TEXT, -- 설명
  file_url TEXT, -- 첨부파일 URL
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_test_lawsuit_submissions_lawsuit_id ON test_lawsuit_submissions(lawsuit_id);
CREATE INDEX IF NOT EXISTS idx_test_lawsuit_submissions_created_by ON test_lawsuit_submissions(created_by);

-- 테이블 주석
COMMENT ON TABLE test_lawsuit_submissions IS '소송 관련 송달 및 제출 문서 내역';
COMMENT ON COLUMN test_lawsuit_submissions.id IS '고유 식별자';
COMMENT ON COLUMN test_lawsuit_submissions.lawsuit_id IS '소송 ID';
COMMENT ON COLUMN test_lawsuit_submissions.submission_type IS '내역 유형 (송달문서, 제출문서)';
COMMENT ON COLUMN test_lawsuit_submissions.document_type IS '문서 유형 (소장, 답변서, 준비서면, 결정문, 판결문 등)';
COMMENT ON COLUMN test_lawsuit_submissions.submission_date IS '송달/제출일';
COMMENT ON COLUMN test_lawsuit_submissions.description IS '설명';
COMMENT ON COLUMN test_lawsuit_submissions.file_url IS '첨부파일 URL (case-files/lawsuit-submissions/ 경로에 저장)';
COMMENT ON COLUMN test_lawsuit_submissions.created_by IS '생성자 ID';
COMMENT ON COLUMN test_lawsuit_submissions.created_at IS '생성 시간';
COMMENT ON COLUMN test_lawsuit_submissions.updated_at IS '수정 시간'; 