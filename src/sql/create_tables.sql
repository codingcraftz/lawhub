-- 법적 프로세스 단계 테이블 생성
CREATE TABLE IF NOT EXISTS test_legal_process_stages (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  process_type TEXT NOT NULL, -- 'civil', 'payment_order', 'execution' 등
  order_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 문서 유형 테이블 생성
CREATE TABLE IF NOT EXISTS test_document_types (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  document_category TEXT NOT NULL, -- 'legal', 'submission', 'receipt', 'contract', 'other' 등
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 사건 진행 상태 테이블 생성
CREATE TABLE IF NOT EXISTS test_case_progress (
  id SERIAL PRIMARY KEY,
  case_id INTEGER REFERENCES test_cases(id) ON DELETE CASCADE,
  stage_id INTEGER REFERENCES test_legal_process_stages(id),
  status TEXT NOT NULL, -- 'pending', 'in_progress', 'completed', 'skipped'
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 회수 활동 로그 테이블 생성
CREATE TABLE IF NOT EXISTS test_recovery_activities (
  id SERIAL PRIMARY KEY,
  case_id INTEGER REFERENCES test_cases(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'call', 'visit', 'payment', 'letter', 'legal', 'other' 등
  date DATE NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(15,2), -- 납부된 금액 (있는 경우)
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 사건 알림 테이블 생성
CREATE TABLE IF NOT EXISTS test_case_notifications (
  id SERIAL PRIMARY KEY,
  case_id INTEGER REFERENCES test_cases(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL, -- 'general', 'important', 'deadline', 'email' 등
  send_date DATE NOT NULL, -- 발송 예정일
  is_sent BOOLEAN DEFAULT FALSE, -- 발송 여부
  sent_at TIMESTAMP WITH TIME ZONE, -- 실제 발송 시간
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 기존 문서 테이블에 document_type_id 필드 추가 (기존 문서 테이블이 있는 경우)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'test_case_documents') THEN
    BEGIN
      ALTER TABLE test_case_documents
      ADD COLUMN IF NOT EXISTS document_type_id INTEGER REFERENCES test_document_types(id);
    EXCEPTION
      WHEN duplicate_column THEN RAISE NOTICE 'column document_type_id already exists in test_case_documents';
    END;
  END IF;
END $$;

-- 법적 프로세스 단계 샘플 데이터
INSERT INTO test_legal_process_stages (name, description, process_type, order_number) VALUES
-- 민사소송 진행 단계
('소장 접수', '소송을 시작하기 위해 법원에 소장을 제출하는 단계', 'civil', 10),
('소장 심사', '법원이 소장의 적법성을 심사하는 단계', 'civil', 20),
('소장 송달', '피고에게 소장이 송달되는 단계', 'civil', 30),
('답변서 제출', '피고가 소장에 대한 답변서를 제출하는 단계', 'civil', 40),
('변론 준비', '본격적인 변론을 위한 준비 단계', 'civil', 50),
('변론 기일', '법정에서 당사자가 주장과 증거를 제출하는 단계', 'civil', 60),
('증거 조사', '제출된 증거의 진위와 관련성을 조사하는 단계', 'civil', 70),
('판결 선고', '법원이 최종 판단을 내리는 단계', 'civil', 80),
('항소 여부 확인', '패소 당사자의 항소 여부를 확인하는 단계', 'civil', 90),
('판결 확정', '더 이상 불복할 수 없는 상태가 되어 판결이 확정되는 단계', 'civil', 100),

-- 지급명령 진행 단계
('지급명령 신청', '채권자가 법원에 지급명령을 신청하는 단계', 'payment_order', 10),
('지급명령 심사', '법원이 지급명령 신청의 적법성을 심사하는 단계', 'payment_order', 20),
('지급명령 발령', '법원이 채무자에게 지급명령을 발령하는 단계', 'payment_order', 30),
('지급명령 송달', '채무자에게 지급명령이 송달되는 단계', 'payment_order', 40),
('이의신청 기간', '채무자가 이의신청을 할 수 있는 기간', 'payment_order', 50),
('지급명령 확정', '이의신청이 없거나 기각되어 지급명령이 확정되는 단계', 'payment_order', 60),
('강제집행 신청', '확정된 지급명령을 근거로 강제집행을 신청하는 단계', 'payment_order', 70),

-- 집행 진행 단계
('집행 신청', '채권자가 법원에 강제집행을 신청하는 단계', 'execution', 10),
('집행 결정', '법원이 강제집행 신청을 허가하는 단계', 'execution', 20),
('재산 조사', '채무자의 재산을 조사하는 단계', 'execution', 30),
('압류 절차', '채무자의 재산을 압류하는 단계', 'execution', 40),
('매각 준비', '압류한 재산의 매각을 준비하는 단계', 'execution', 50),
('매각 실행', '압류한 재산을 매각하는 단계', 'execution', 60),
('배당 절차', '매각 대금을 채권자들에게 배당하는 단계', 'execution', 70),
('집행 종결', '강제집행 절차가 종결되는 단계', 'execution', 80)
ON CONFLICT (id) DO NOTHING;

-- 문서 유형 샘플 데이터
INSERT INTO test_document_types (name, document_category, description) VALUES
('소장', 'legal', '소송을 제기하는 문서'),
('답변서', 'legal', '소송에 대한 피고의 답변'),
('준비서면', 'legal', '소송 진행 중 당사자가 제출하는 주장 문서'),
('판결문', 'legal', '법원의 판결 내용을 담은 문서'),
('지급명령', 'legal', '지급명령 신청에 따른 법원의 명령 문서'),
('가압류결정문', 'legal', '가압류 신청에 따른 법원의 결정 문서'),
('신청서', 'submission', '법원에 제출하는 각종 신청 서류'),
('보정명령', 'legal', '법원이 서류 보완을 요청하는 명령'),
('보정서', 'submission', '보정명령에 따라 제출하는 서류'),
('영수증', 'receipt', '납부 증빙 서류'),
('계약서', 'contract', '당사자 간 체결한 계약 문서'),
('내용증명', 'legal', '우편으로 발송한 내용증명 문서'),
('위임장', 'submission', '업무 위임 관련 문서'),
('기타 문서', 'other', '기타 분류되지 않은 문서')
ON CONFLICT (id) DO NOTHING; 