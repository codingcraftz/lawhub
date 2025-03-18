-- 테이블에 RLS 활성화
ALTER TABLE test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_case_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_case_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_case_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_recovery_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_case_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_case_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_legal_process_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_document_types ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있는 경우)
DROP POLICY IF EXISTS "Admin Staff Full Access" ON test_cases;
DROP POLICY IF EXISTS "Users View Own Cases" ON test_cases;
DROP POLICY IF EXISTS "Admin Staff Full Access" ON test_case_parties;
DROP POLICY IF EXISTS "Users View Own Case Parties" ON test_case_parties;
DROP POLICY IF EXISTS "Admin Staff Full Access" ON test_case_clients;
DROP POLICY IF EXISTS "Users View Own Case Clients" ON test_case_clients;
DROP POLICY IF EXISTS "Admin Staff Full Access" ON test_case_documents;
DROP POLICY IF EXISTS "Users View Own Case Documents" ON test_case_documents;
DROP POLICY IF EXISTS "Admin Staff Full Access" ON test_recovery_activities;
DROP POLICY IF EXISTS "Users View Own Case Activities" ON test_recovery_activities;
DROP POLICY IF EXISTS "Admin Staff Full Access" ON test_case_notifications;
DROP POLICY IF EXISTS "Users View Own Case Notifications" ON test_case_notifications;
DROP POLICY IF EXISTS "Admin Staff Full Access" ON test_case_progress;
DROP POLICY IF EXISTS "Users View Own Case Progress" ON test_case_progress;
DROP POLICY IF EXISTS "Everyone View Process Stages" ON test_legal_process_stages;
DROP POLICY IF EXISTS "Everyone View Document Types" ON test_document_types;

-- 관리자와 직원은 모든 테이블에 대한 모든 권한 부여
-- test_cases 테이블에 대한 정책
CREATE POLICY "Admin Staff Full Access"
ON test_cases FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND (role = 'admin' OR role = 'staff')
  )
);

-- 일반 사용자는 자신의 사건만 조회 가능
CREATE POLICY "Users View Own Cases"
ON test_cases FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM test_case_clients
    JOIN users ON users.id = auth.uid()
    WHERE test_case_clients.case_id = test_cases.id
    AND users.role = 'user'
  )
);

-- test_case_parties 테이블에 대한 정책
CREATE POLICY "Admin Staff Full Access"
ON test_case_parties FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND (role = 'admin' OR role = 'staff')
  )
);

CREATE POLICY "Users View Own Case Parties"
ON test_case_parties FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM test_cases
    JOIN test_case_clients ON test_cases.id = test_case_clients.case_id
    JOIN users ON users.id = auth.uid()
    WHERE test_case_parties.case_id = test_cases.id
    AND users.role = 'user'
  )
);

-- test_case_clients 테이블에 대한 정책
CREATE POLICY "Admin Staff Full Access"
ON test_case_clients FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND (role = 'admin' OR role = 'staff')
  )
);

CREATE POLICY "Users View Own Case Clients"
ON test_case_clients FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM test_cases
    JOIN test_case_clients ON test_cases.id = test_case_clients.case_id
    WHERE test_case_clients.case_id = test_case_clients.case_id
    AND (
      test_case_clients.individual_id = auth.uid() 
      OR EXISTS (
        SELECT 1 FROM test_organization_members
        WHERE test_organization_members.organization_id = test_case_clients.organization_id
        AND test_organization_members.user_id = auth.uid()
      )
    )
  )
);

-- test_case_documents 테이블에 대한 정책
CREATE POLICY "Admin Staff Full Access"
ON test_case_documents FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND (role = 'admin' OR role = 'staff')
  )
);

CREATE POLICY "Users View Own Case Documents"
ON test_case_documents FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM test_cases
    JOIN test_case_clients ON test_cases.id = test_case_clients.case_id
    JOIN users ON users.id = auth.uid()
    WHERE test_case_documents.case_id = test_cases.id
    AND users.role = 'user'
  )
);

-- test_recovery_activities 테이블에 대한 정책
CREATE POLICY "Admin Staff Full Access"
ON test_recovery_activities FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND (role = 'admin' OR role = 'staff')
  )
);

CREATE POLICY "Users View Own Case Activities"
ON test_recovery_activities FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM test_cases
    JOIN test_case_clients ON test_cases.id = test_case_clients.case_id
    JOIN users ON users.id = auth.uid()
    WHERE test_recovery_activities.case_id = test_cases.id
    AND users.role = 'user'
  )
);

-- test_case_notifications 테이블에 대한 정책
CREATE POLICY "Admin Staff Full Access"
ON test_case_notifications FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND (role = 'admin' OR role = 'staff')
  )
);

CREATE POLICY "Users View Own Case Notifications"
ON test_case_notifications FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM test_cases
    JOIN test_case_clients ON test_cases.id = test_case_clients.case_id
    JOIN users ON users.id = auth.uid()
    WHERE test_case_notifications.case_id = test_cases.id
    AND users.role = 'user'
  )
);

-- test_case_progress 테이블에 대한 정책
CREATE POLICY "Admin Staff Full Access"
ON test_case_progress FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND (role = 'admin' OR role = 'staff')
  )
);

CREATE POLICY "Users View Own Case Progress"
ON test_case_progress FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM test_cases
    JOIN test_case_clients ON test_cases.id = test_case_clients.case_id
    JOIN users ON users.id = auth.uid()
    WHERE test_case_progress.case_id = test_cases.id
    AND users.role = 'user'
  )
);

-- test_legal_process_stages 테이블에 대한 정책 (모든 사용자가 조회 가능)
CREATE POLICY "Everyone View Process Stages"
ON test_legal_process_stages FOR SELECT
TO authenticated
USING (true);

-- test_document_types 테이블에 대한 정책 (모든 사용자가 조회 가능)
CREATE POLICY "Everyone View Document Types"
ON test_document_types FOR SELECT
TO authenticated
USING (true);

-- 스토리지 버킷 설정
-- 문서 저장용 스토리지 버킷 생성 (없는 경우)
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES ('case-documents', '사건 관련 문서 저장소', false, false, 10485760, null)
ON CONFLICT (id) DO NOTHING;

-- 문서 버킷 RLS 정책 설정
DROP POLICY IF EXISTS "Admin and Staff Access" ON storage.objects;
DROP POLICY IF EXISTS "Users View Own Case Documents Storage" ON storage.objects;

-- 관리자와 직원은 모든 파일에 대한 모든 권한
CREATE POLICY "Admin and Staff Access"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'case-documents' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND (role = 'admin' OR role = 'staff')
  )
);

-- 일반 사용자는 자신의
 사건 관련 파일만 조회 가능
CREATE POLICY "Users View Own Case Documents Storage"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'case-documents' AND
  EXISTS (
    SELECT 1 FROM test_cases
    JOIN test_case_clients ON test_cases.id = test_case_clients.case_id
    JOIN users ON users.id = auth.uid()
    WHERE storage.objects.name LIKE 'cases/' || test_cases.id::text || '/%'
    AND users.role = 'user'
  )
); 