-- 담당자 테이블 생성
CREATE TABLE IF NOT EXISTS test_case_handlers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES test_users(id) ON DELETE CASCADE,
    role VARCHAR DEFAULT '담당자',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (case_id, user_id)
);

-- 테이블 설명 추가
COMMENT ON TABLE test_case_handlers IS '사건 담당자 정보를 관리하는 테이블';
COMMENT ON COLUMN test_case_handlers.id IS '담당자 고유 식별자';
COMMENT ON COLUMN test_case_handlers.case_id IS '사건 ID (외래키)';
COMMENT ON COLUMN test_case_handlers.user_id IS '사용자 ID (외래키)';
COMMENT ON COLUMN test_case_handlers.role IS '역할 (담당변호사, 직원 등)';
COMMENT ON COLUMN test_case_handlers.created_at IS '생성 시간';
COMMENT ON COLUMN test_case_handlers.updated_at IS '수정 시간';

-- 사용자 테이블에 employee_type 컬럼 추가
ALTER TABLE test_users
ADD COLUMN IF NOT EXISTS employee_type VARCHAR DEFAULT 'internal';

-- 컬럼 설명 추가
COMMENT ON COLUMN test_users.employee_type IS '직원 유형 (internal, external)';

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_case_handlers_case_id ON test_case_handlers(case_id);
CREATE INDEX IF NOT EXISTS idx_case_handlers_user_id ON test_case_handlers(user_id);

-- RLS(Row Level Security) 정책 설정
ALTER TABLE test_case_handlers ENABLE ROW LEVEL SECURITY;

-- 기본 RLS 정책: 관리자는 모든 권한, 인증된 사용자는 자신의 담당 사건만 접근 가능
CREATE POLICY "관리자는 모든 담당자 정보 접근 가능"
ON test_case_handlers
FOR ALL
TO authenticated
USING (auth.uid() IN (SELECT id FROM test_users WHERE role = 'admin'));

CREATE POLICY "사용자는 자신의 담당 정보만 조회 가능"
ON test_case_handlers
FOR SELECT
TO authenticated
USING (auth.uid() = user_id); 