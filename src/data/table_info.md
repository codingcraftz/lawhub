# 데이터베이스 테이블 정보

## 사용자 테이블 (users)

| 컬럼명        | 데이터 타입              | 설명                                       |
| ------------- | ------------------------ | ------------------------------------------ |
| id            | uuid                     | 사용자 고유 식별자                         |
| email         | text                     | 사용자 이메일                              |
| name          | text                     | 사용자 이름                                |
| phone_number  | text                     | 전화번호                                   |
| birth_date    | date                     | 생년월일                                   |
| gender        | text                     | 성별                                       |
| role          | text                     | 역할 (staff, client, admin)                |
| created_at    | timestamp with time zone | 생성 시간                                  |
| nickname      | text                     | 닉네임                                     |
| profile_image | text                     | 프로필 이미지 경로                         |
| position      | text                     | 직책 (개발자, 대표, 변호사, 사무직원, etc) |
| employee_type | text                     | 고용 형태 (internal, external)             |

## 조직 테이블 (test_organizations)

| 컬럼명                  | 데이터 타입              | 설명             |
| ----------------------- | ------------------------ | ---------------- |
| id                      | uuid                     | 조직 고유 식별자 |
| name                    | varchar(255)             | 조직명 (필수)    |
| business_number         | varchar(20)              | 사업자 번호      |
| address                 | text                     | 주소             |
| phone                   | varchar(20)              | 전화번호         |
| email                   | varchar(255)             | 이메일           |
| representative_name     | varchar(100)             | 대표자 이름      |
| representative_position | varchar(100)             | 대표자 직위      |
| created_at              | timestamp with time zone | 생성 시간        |
| updated_at              | timestamp with time zone | 수정 시간        |

## 조직 구성원 테이블 (test_organization_members)

| 컬럼명          | 데이터 타입              | 설명                           |
| --------------- | ------------------------ | ------------------------------ |
| id              | uuid                     | 구성원 고유 식별자             |
| organization_id | uuid                     | 조직 ID (외래키)               |
| user_id         | uuid                     | 사용자 ID (외래키)             |
| position        | varchar(100)             | 직위                           |
| role            | varchar(50)              | 역할 (admin, staff, member 등) |
| is_primary      | boolean                  | 주 담당자 여부                 |
| created_at      | timestamp with time zone | 생성 시간                      |
| updated_at      | timestamp with time zone | 수정 시간                      |

## 사건 테이블 (test_cases)

| 컬럼명           | 데이터 타입              | 설명                                                 |
| ---------------- | ------------------------ | ---------------------------------------------------- |
| id               | uuid                     | 사건 고유 식별자                                     |
| case_number      | varchar                  | 사건번호                                             |
| case_type        | varchar                  | 사건 유형 (civil, debt_collection 등)                |
| status           | varchar                  | 상태 (pending, in_progress, completed, cancelled 등) |
| filing_date      | date                     | 접수일                                               |
| court_name       | varchar                  | 법원명                                               |
| case_info        | varchar                  | 사건 정보                                            |
| principal_amount | numeric                  | 청구 금액                                            |
| created_at       | timestamp with time zone | 생성 시간                                            |
| updated_at       | timestamp with time zone | 수정 시간                                            |

## 사건 당사자 테이블 (test_case_parties)

| 컬럼명            | 데이터 타입              | 설명                                                    |
| ----------------- | ------------------------ | ------------------------------------------------------- |
| id                | uuid                     | 당사자 고유 식별자                                      |
| case_id           | uuid                     | 사건 ID (외래키)                                        |
| party_type        | varchar(20)              | 당사자 유형 (plaintiff, defendant, creditor, debtor 등) |
| party_entity_type | varchar(20)              | 당사자 엔티티 유형 (individual, organization)           |
| name              | varchar(255)             | 이름                                                    |
| id_number         | varchar(20)              | 주민등록번호                                            |
| company_name      | varchar(255)             | 회사명                                                  |
| business_number   | varchar(20)              | 사업자 번호                                             |
| phone             | varchar(20)              | 전화번호                                                |
| address           | text                     | 주소                                                    |
| address_detail    | text                     | 상세 주소                                               |
| email             | varchar(255)             | 이메일                                                  |
| created_at        | timestamp with time zone | 생성 시간                                               |
| updated_at        | timestamp with time zone | 수정 시간                                               |

## 사건 의뢰인 테이블 (test_case_clients)

| 컬럼명          | 데이터 타입              | 설명                                        |
| --------------- | ------------------------ | ------------------------------------------- |
| id              | uuid                     | 의뢰인 고유 식별자                          |
| case_id         | uuid                     | 사건 ID (외래키)                            |
| client_type     | varchar(20)              | 의뢰인 유형 (individual, organization)      |
| individual_id   | uuid                     | 개인 ID (외래키, users 테이블)              |
| organization_id | uuid                     | 조직 ID (외래키, test_organizations 테이블) |
| position        | varchar(100)             | 직위                                        |
| created_at      | timestamp with time zone | 생성 시간                                   |
| updated_at      | timestamp with time zone | 수정 시간                                   |

## 사건 이자 정보 테이블 (test_case_interests)

| 컬럼명     | 데이터 타입              | 설명             |
| ---------- | ------------------------ | ---------------- |
| id         | uuid                     | 이자 고유 식별자 |
| case_id    | uuid                     | 사건 ID (외래키) |
| start_date | date                     | 기산일           |
| end_date   | date                     | 종기일           |
| rate       | decimal(5,2)             | 이자율 (%)       |
| created_at | timestamp with time zone | 생성 시간        |
| updated_at | timestamp with time zone | 수정 시간        |

## 채권 정보 테이블 (test_debt_claims)

| 컬럼명            | 데이터 타입              | 설명                                         |
| ----------------- | ------------------------ | -------------------------------------------- |
| id                | uuid                     | 채권 고유 식별자                             |
| case_id           | uuid                     | 사건 ID (외래키)                             |
| creditor_party_id | uuid                     | 채권자 ID (외래키, test_case_parties 테이블) |
| debtor_party_id   | uuid                     | 채무자 ID (외래키, test_case_parties 테이블) |
| claim_basis       | varchar(255)             | 채권발생근거 (대여금, 물품대금, 용역대금 등) |
| principal_amount  | decimal(18,2)            | 원금                                         |
| interest_rate     | decimal(5,2)             | 이자율 (%)                                   |
| interest_amount   | decimal(18,2)            | 이자 금액                                    |
| total_amount      | decimal(18,2)            | 총 청구금액                                  |
| due_date          | date                     | 변제기일                                     |
| status            | varchar(50)              | 상태 (active, partially_paid, paid)          |
| description       | text                     | 설명                                         |
| created_at        | timestamp with time zone | 생성 시간                                    |
| updated_at        | timestamp with time zone | 수정 시간                                    |

## 사건 문서 테이블 (test_case_documents)

| 컬럼명           | 데이터 타입              | 설명                                              |
| ---------------- | ------------------------ | ------------------------------------------------- |
| id               | uuid                     | 문서 고유 식별자                                  |
| case_id          | uuid                     | 사건 ID (외래키)                                  |
| title            | text                     | 문서 제목                                         |
| file_path        | text                     | 파일 경로                                         |
| file_name        | text                     | 파일명                                            |
| file_size        | integer                  | 파일 크기 (바이트)                                |
| file_type        | text                     | 파일 유형                                         |
| document_type_id | integer                  | 문서 타입 ID (외래키, test_document_types 테이블) |
| document_date    | date                     | 문서 날짜                                         |
| description      | text                     | 설명                                              |
| uploaded_by      | uuid                     | 업로더 ID (외래키, users 테이블)                  |
| created_at       | timestamp with time zone | 생성 시간                                         |
| updated_at       | timestamp with time zone | 수정 시간                                         |

## 사건 비용 정보 테이블 (test_case_expenses)

| 컬럼명       | 데이터 타입              | 설명                                                |
| ------------ | ------------------------ | --------------------------------------------------- |
| id           | uuid                     | 비용 고유 식별자                                    |
| case_id      | uuid                     | 사건 ID (외래키)                                    |
| expense_type | varchar(50)              | 비용 유형 (서기료, 송달료, 인지액, 예납금, 기타 등) |
| amount       | decimal(15,2)            | 금액                                                |
| created_at   | timestamp with time zone | 생성 시간                                           |
| updated_at   | timestamp with time zone | 수정 시간                                           |

## 사건 담당자 테이블 (test_case_handlers)

| 컬럼명     | 데이터 타입              | 설명                       |
| ---------- | ------------------------ | -------------------------- |
| id         | uuid                     | 담당자 고유 식별자         |
| case_id    | uuid                     | 사건 ID (외래키)           |
| user_id    | uuid                     | 사용자 ID (외래키)         |
| role       | varchar(50)              | 역할 (담당변호사, 직원 등) |
| created_at | timestamp with time zone | 생성 시간                  |
| updated_at | timestamp with time zone | 수정 시간                  |

## 법적 프로세스 단계 테이블 (test_legal_process_stages)

| 컬럼명       | 데이터 타입              | 설명                                               |
| ------------ | ------------------------ | -------------------------------------------------- |
| id           | integer                  | 단계 고유 식별자                                   |
| name         | text                     | 단계 이름                                          |
| description  | text                     | 단계 설명                                          |
| process_type | text                     | 프로세스 유형 (civil, payment_order, execution 등) |
| order_number | integer                  | 단계 순서                                          |
| created_at   | timestamp with time zone | 생성 시간                                          |

## 사건 진행 상태 테이블 (test_case_progress)

| 컬럼명     | 데이터 타입              | 설명                                               |
| ---------- | ------------------------ | -------------------------------------------------- |
| id         | integer                  | 진행 상태 고유 식별자                              |
| case_id    | integer                  | 사건 ID (외래키)                                   |
| stage_id   | integer                  | 단계 ID (외래키, test_legal_process_stages 테이블) |
| status     | text                     | 상태 (pending, in_progress, completed, skipped)    |
| start_date | timestamp with time zone | 시작일시                                           |
| end_date   | timestamp with time zone | 종료일시                                           |
| notes      | text                     | 비고                                               |
| updated_by | uuid                     | 업데이트한 사용자 ID (외래키, users 테이블)        |
| created_at | timestamp with time zone | 생성 시간                                          |
| updated_at | timestamp with time zone | 수정 시간                                          |

## 회수 활동 로그 테이블 (test_recovery_activities)

| 컬럼명        | 데이터 타입              | 설명                                               |
| ------------- | ------------------------ | -------------------------------------------------- |
| id            | uuid                     | 활동 고유 식별자                                   |
| case_id       | uuid                     | 사건 ID (외래키)                                   |
| activity_type | character varying        | 활동 유형 (call, visit, payment, letter, legal 등) |
| date          | date                     | 활동 날짜                                          |
| description   | text                     | 활동 설명                                          |
| amount        | numeric                  | 납부 금액 (있는 경우)                              |
| notes         | text                     | 추가 메모                                          |
| status        | text                     | 상태 (predicted: 예정, completed: 완료)            |
| file_url      | text                     | 첨부파일 URL                                       |
| created_by    | uuid                     | 생성자 ID (외래키, auth.users 테이블)              |
| created_at    | timestamp with time zone | 생성 시간                                          |
| updated_at    | timestamp with time zone | 수정 시간                                          |

## 사건 알림 테이블 (test_case_notifications)

| 컬럼명            | 데이터 타입              | 설명                                               |
| ----------------- | ------------------------ | -------------------------------------------------- |
| id                | uuid                     | 알림 고유 식별자                                   |
| case_id           | uuid                     | 사건 ID (외래키)                                   |
| title             | varchar                  | 알림 제목                                          |
| message           | text                     | 알림 내용                                          |
| notification_type | varchar                  | 알림 유형 (general, important, deadline, email 등) |
| is_read           | boolean                  | 읽음 여부                                          |
| user_id           | uuid                     | 사용자 ID (외래키, users 테이블)                   |
| created_at        | timestamp with time zone | 생성 시간                                          |

## 문서 타입 정의 테이블 (test_document_types)

| 컬럼명            | 데이터 타입              | 설명                                           |
| ----------------- | ------------------------ | ---------------------------------------------- |
| id                | integer                  | 문서 타입 고유 식별자                          |
| name              | text                     | 문서 타입 이름                                 |
| document_category | text                     | 문서 카테고리 (legal, submission, contract 등) |
| description       | text                     | 설명                                           |
| created_at        | timestamp with time zone | 생성 시간                                      |

## 소송 테이블 (test_case_lawsuits)

| 컬럼명       | 데이터 타입              | 설명                                             |
| ------------ | ------------------------ | ------------------------------------------------ |
| id           | uuid                     | 소송 고유 식별자                                 |
| case_id      | uuid                     | 사건 ID (외래키)                                 |
| lawsuit_type | varchar                  | 소송 유형 (civil, payment_order, execution 등)   |
| court_name   | varchar                  | 법원명                                           |
| case_number  | varchar                  | 사건번호                                         |
| filing_date  | date                     | 접수일                                           |
| status       | varchar                  | 상태 (pending, filed, in_progress, completed 등) |
| description  | text                     | 설명                                             |
| created_by   | uuid                     | 생성자 ID (외래키, auth.users 테이블)            |
| created_at   | timestamp with time zone | 생성 시간                                        |
| updated_at   | timestamp with time zone | 수정 시간                                        |

## 소송 당사자 연결 테이블 (test_lawsuit_parties)

| 컬럼명     | 데이터 타입              | 설명                                         |
| ---------- | ------------------------ | -------------------------------------------- |
| id         | uuid                     | 소송 당사자 연결 고유 식별자                 |
| lawsuit_id | uuid                     | 소송 ID (외래키, test_case_lawsuits 테이블)  |
| party_id   | uuid                     | 당사자 ID (외래키, test_case_parties 테이블) |
| party_type | varchar                  | 당사자 유형 (원고, 피고, 신청인, 피신청인)   |
| created_at | timestamp with time zone | 생성 시간                                    |

## 소송 송달 및 제출 내역 테이블 (test_lawsuit_submissions)

| 컬럼명          | 데이터 타입              | 설명                                                  |
| --------------- | ------------------------ | ----------------------------------------------------- |
| id              | uuid                     | 송달/제출 내역 고유 식별자                            |
| lawsuit_id      | uuid                     | 소송 ID (외래키, test_case_lawsuits 테이블)           |
| submission_type | varchar                  | 유형 (송달문서, 제출문서)                             |
| document_type   | varchar                  | 문서 유형 (소장, 답변서, 준비서면, 결정문, 판결문 등) |
| submission_date | date                     | 송달/제출일                                           |
| description     | text                     | 설명                                                  |
| file_url        | text                     | 첨부파일 URL                                          |
| created_by      | uuid                     | 생성자 ID (외래키, auth.users 테이블)                 |
| created_at      | timestamp with time zone | 생성 시간                                             |
| updated_at      | timestamp with time zone | 수정 시간                                             |

## 테이블 관계

- **users** ↔ **test_organization_members**: 1:N (한 사용자는 여러 조직에 소속될 수 있음)
- **users** ↔ **test_case_clients**: 1:N (한 사용자는 여러 사건의 의뢰인이 될 수 있음)
- **users** ↔ **test_case_documents**: 1:N (한 사용자는 여러 문서를 업로드할 수 있음)
- **users** ↔ **test_case_handlers**: 1:N (한 사용자는 여러 사건의 담당자가 될 수 있음)
- **users** ↔ **test_case_progress**: 1:N (한 사용자는 여러 진행 상태를 업데이트할 수 있음)
- **users** ↔ **test_recovery_activities**: 1:N (한 사용자는 여러 회수 활동을 기록할 수 있음)
- **users** ↔ **test_case_notifications**: 1:N (한 사용자는 여러 알림을 생성할 수 있음)
- **users** ↔ **test_notifications**: 1:N (한 사용자는 여러 알림을 받을 수 있음)
- **test_organizations** ↔ **test_organization_members**: 1:N (한 조직은 여러 구성원을 가질 수 있음)
- **test_organizations** ↔ **test_case_clients**: 1:N (한 조직은 여러 사건의 의뢰인이 될 수 있음)
- **test_cases** ↔ **test_case_parties**: 1:N (한 사건은 여러 당사자를 가질 수 있음)
- **test_cases** ↔ **test_case_clients**: 1:N (한 사건은 여러 의뢰인을 가질 수 있음)
- **test_cases** ↔ **test_debt_claims**: 1:N (한 사건은 여러 채권 정보를 가질 수 있음)
- **test_cases** ↔ **test_case_interests**: 1:N (한 사건은 여러 이자 정보를 가질 수 있음)
- **test_cases** ↔ **test_case_documents**: 1:N (한 사건은 여러 문서를 가질 수 있음)
- **test_cases** ↔ **test_case_handlers**: 1:N (한 사건은 여러 담당자를 가질 수 있음)
- **test_cases** ↔ **test_case_progress**: 1:N (한 사건은 여러 진행 상태를 가질 수 있음)
- **test_cases** ↔ **test_recovery_activities**: 1:N (한 사건은 여러 회수 활동을 가질 수 있음)
- **test_cases** ↔ **test_case_notifications**: 1:N (한 사건은 여러 알림을 생성할 수 있음)
- **test_cases** ↔ **test_notifications**: 1:N (한 사건은 여러 알림을 생성할 수 있음)
- **test_case_parties** ↔ **test_debt_claims**: 1:N (한 당사자는 여러 채권/채무 관계를 가질 수 있음)
- **test_legal_process_stages** ↔ **test_case_progress**: 1:N (한 법적 프로세스 단계는 여러 사건의 진행 상태에 연결될 수 있음)
- **test_document_types** ↔ **test_case_documents**: 1:N (한 문서 유형은 여러 문서에 적용될 수 있음)

## 알림 테이블 (test_notifications)

| 컬럼명            | 데이터 타입              | 설명                                                |
| ----------------- | ------------------------ | --------------------------------------------------- |
| id                | uuid                     | 알림 고유 식별자                                    |
| user_id           | uuid                     | 알림을 받을 사용자 ID (외래키, auth.users 테이블)   |
| case_id           | uuid                     | 관련 사건 ID (외래키, test_cases 테이블)            |
| title             | varchar                  | 알림 제목                                           |
| message           | text                     | 알림 내용                                           |
| notification_type | varchar                  | 알림 유형 (lawsuit_update, recovery_activity, etc)  |
| is_read           | boolean                  | 읽음 여부                                           |
| created_at        | timestamp with time zone | 생성 시간                                           |
| related_entity    | varchar                  | 관련 엔티티 유형 (submission, recovery, lawsuit 등) |
| related_id        | uuid                     | 관련 엔티티 ID                                      |
