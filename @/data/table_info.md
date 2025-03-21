# 데이터베이스 테이블 구조

## 사건 테이블 (test_cases)

| 컬럼명           | 데이터 타입              | 설명             |
| ---------------- | ------------------------ | ---------------- |
| id               | uuid                     | 사건 고유 식별자 |
| case_type        | character varying(50)    | 사건 유형        |
| status           | character varying(50)    | 사건 상태        |
| filing_date      | date                     | 접수일           |
| principal_amount | numeric                  | 원금             |
| status_id        | uuid                     | 상태 ID          |
| debt_category    | text                     | 채권 분류        |
| created_at       | timestamp with time zone | 생성 시간        |
| updated_at       | timestamp with time zone | 수정 시간        |

## 사건 담당자 테이블 (test_case_handlers)

| 컬럼명     | 데이터 타입 | 설명                       |
| ---------- | ----------- | -------------------------- |
| id         | uuid        | 담당자 고유 식별자         |
| case_id    | uuid        | 사건 ID (외래키)           |
| user_id    | uuid        | 사용자 ID (외래키)         |
| role       | text        | 역할 (담당변호사, 직원 등) |
| created_at | date        | 생성 시간                  |
| updated_at | date        | 수정 시간                  |

## 사건 의뢰인 테이블 (test_case_clients)

| 컬럼명          | 데이터 타입              | 설명        |
| --------------- | ------------------------ | ----------- |
| id              | uuid                     | 고유 식별자 |
| case_id         | uuid                     | 사건 ID     |
| client_type     | character varying(20)    | 의뢰인 유형 |
| individual_id   | uuid                     | 개인 ID     |
| organization_id | uuid                     | 조직 ID     |
| position        | character varying(100)   | 직위        |
| created_at      | timestamp with time zone | 생성 시간   |
| updated_at      | timestamp with time zone | 수정 시간   |

## 사건 비용 테이블 (test_case_expenses)

| 컬럼명       | 데이터 타입              | 설명        |
| ------------ | ------------------------ | ----------- |
| id           | uuid                     | 고유 식별자 |
| case_id      | uuid                     | 사건 ID     |
| expense_type | character varying(50)    | 비용 유형   |
| amount       | numeric                  | 금액        |
| created_at   | timestamp with time zone | 생성 시간   |
| updated_at   | timestamp with time zone | 수정 시간   |

## 사건 이자 테이블 (test_case_interests)

| 컬럼명     | 데이터 타입              | 설명        |
| ---------- | ------------------------ | ----------- |
| id         | uuid                     | 고유 식별자 |
| case_id    | uuid                     | 사건 ID     |
| start_date | date                     | 시작일      |
| end_date   | date                     | 종료일      |
| rate       | numeric                  | 이자율      |
| created_at | timestamp with time zone | 생성 시간   |
| updated_at | timestamp with time zone | 수정 시간   |

## 소송 테이블 (test_case_lawsuits)

| 컬럼명       | 데이터 타입              | 설명        |
| ------------ | ------------------------ | ----------- |
| id           | uuid                     | 고유 식별자 |
| case_id      | uuid                     | 사건 ID     |
| lawsuit_type | text                     | 소송 유형   |
| court_name   | text                     | 법원명      |
| case_number  | text                     | 사건번호    |
| filing_date  | timestamp with time zone | 접수일      |
| description  | text                     | 설명        |
| status       | text                     | 상태        |
| created_by   | uuid                     | 작성자 ID   |
| created_at   | timestamp with time zone | 생성 시간   |
| updated_at   | timestamp with time zone | 수정 시간   |

## 사건 알림 테이블 (test_case_notifications)

| 컬럼명            | 데이터 타입              | 설명        |
| ----------------- | ------------------------ | ----------- |
| id                | uuid                     | 고유 식별자 |
| case_id           | uuid                     | 사건 ID     |
| title             | character varying(255)   | 제목        |
| message           | text                     | 메시지      |
| notification_type | character varying(50)    | 알림 유형   |
| is_read           | boolean                  | 읽음 여부   |
| user_id           | uuid                     | 사용자 ID   |
| created_at        | timestamp with time zone | 생성 시간   |

## 사건 당사자 테이블 (test_case_parties)

| 컬럼명                        | 데이터 타입              | 설명           |
| ----------------------------- | ------------------------ | -------------- |
| id                            | uuid                     | 고유 식별자    |
| case_id                       | uuid                     | 사건 ID        |
| party_type                    | text                     | 당사자 유형    |
| entity_type                   | text                     | 법인 유형      |
| name                          | character varying(255)   | 이름           |
| company_name                  | character varying(255)   | 회사명         |
| corporate_registration_number | character varying(20)    | 사업자등록번호 |
| position                      | character varying(100)   | 직위           |
| phone                         | character varying(20)    | 전화번호       |
| address                       | text                     | 주소           |
| address_detail                | text                     | 상세주소       |
| email                         | character varying(255)   | 이메일         |
| resident_number               | character varying(20)    | 주민등록번호   |
| corporate_number              | character varying(20)    | 법인번호       |
| representative_name           | text                     | 대표자명       |
| representative_position       | text                     | 대표자 직위    |
| created_at                    | timestamp with time zone | 생성 시간      |
| updated_at                    | timestamp with time zone | 수정 시간      |

## 채권 청구 테이블 (test_debt_claims)

| 컬럼명            | 데이터 타입              | 설명        |
| ----------------- | ------------------------ | ----------- |
| id                | uuid                     | 고유 식별자 |
| case_id           | uuid                     | 사건 ID     |
| creditor_party_id | uuid                     | 채권자 ID   |
| debtor_party_id   | uuid                     | 채무자 ID   |
| claim_basis       | character varying(255)   | 청구 근거   |
| principal_amount  | numeric                  | 원금        |
| interest_rate     | numeric                  | 이자율      |
| interest_amount   | numeric                  | 이자 금액   |
| total_amount      | numeric                  | 총액        |
| due_date          | date                     | 만기일      |
| status            | character varying(50)    | 상태        |
| description       | text                     | 설명        |
| created_at        | timestamp with time zone | 생성 시간   |
| updated_at        | timestamp with time zone | 수정 시간   |

## 문서 유형 테이블 (test_document_types)

| 컬럼명      | 데이터 타입              | 설명        |
| ----------- | ------------------------ | ----------- |
| id          | uuid                     | 고유 식별자 |
| name        | character varying(100)   | 문서 유형명 |
| description | text                     | 설명        |
| category    | character varying(50)    | 분류        |
| created_at  | timestamp with time zone | 생성 시간   |

## 소송 당사자 테이블 (test_lawsuit_parties)

| 컬럼명     | 데이터 타입              | 설명        |
| ---------- | ------------------------ | ----------- |
| id         | uuid                     | 고유 식별자 |
| lawsuit_id | uuid                     | 소송 ID     |
| party_id   | uuid                     | 당사자 ID   |
| party_type | text                     | 당사자 유형 |
| created_at | timestamp with time zone | 생성 시간   |
| updated_at | timestamp with time zone | 수정 시간   |

## 소송 제출 문서 테이블 (test_lawsuit_submissions)

| 컬럼명          | 데이터 타입              | 설명        |
| --------------- | ------------------------ | ----------- |
| id              | uuid                     | 고유 식별자 |
| lawsuit_id      | uuid                     | 소송 ID     |
| submission_type | character varying(50)    | 제출 유형   |
| document_type   | character varying(100)   | 문서 유형   |
| submission_date | date                     | 제출일      |
| description     | text                     | 설명        |
| file_url        | text                     | 파일 URL    |
| related_docs    | ARRAY                    | 관련 문서   |
| created_by      | uuid                     | 작성자 ID   |
| created_at      | timestamp with time zone | 생성 시간   |
| updated_at      | timestamp with time zone | 수정 시간   |

## 조직 구성원 테이블 (test_organization_members)

| 컬럼명          | 데이터 타입              | 설명         |
| --------------- | ------------------------ | ------------ |
| id              | uuid                     | 고유 식별자  |
| organization_id | uuid                     | 조직 ID      |
| user_id         | uuid                     | 사용자 ID    |
| position        | character varying(100)   | 직위         |
| role            | character varying(50)    | 역할         |
| is_primary      | boolean                  | 주 소속 여부 |
| created_at      | timestamp with time zone | 생성 시간    |
| updated_at      | timestamp with time zone | 수정 시간    |

## 조직 테이블 (test_organizations)

| 컬럼명                  | 데이터 타입              | 설명        |
| ----------------------- | ------------------------ | ----------- |
| id                      | uuid                     | 고유 식별자 |
| name                    | character varying(255)   | 조직명      |
| business_number         | character varying(20)    | 사업자번호  |
| address                 | text                     | 주소        |
| phone                   | character varying(20)    | 전화번호    |
| email                   | character varying(255)   | 이메일      |
| representative_name     | character varying(100)   | 대표자명    |
| representative_position | character varying(100)   | 대표자 직위 |
| created_at              | timestamp with time zone | 생성 시간   |
| updated_at              | timestamp with time zone | 수정 시간   |

## 납부 계획 테이블 (test_payment_plans)

| 컬럼명             | 데이터 타입              | 설명            |
| ------------------ | ------------------------ | --------------- |
| id                 | uuid                     | 고유 식별자     |
| case_id            | uuid                     | 사건 ID         |
| lawsuit_id         | uuid                     | 소송 ID         |
| debtor_id          | uuid                     | 채무자 ID       |
| total_amount       | numeric                  | 총액            |
| monthly_amount     | numeric                  | 월 납부액       |
| installment_count  | integer                  | 분할 횟수       |
| payment_day        | integer                  | 납부일          |
| start_date         | date                     | 시작일          |
| end_date           | date                     | 종료일          |
| current_status     | text                     | 현재 상태       |
| interest_rate      | numeric                  | 이자율          |
| agreement_file_url | text                     | 약정서 파일 URL |
| notes              | text                     | 비고            |
| created_by         | uuid                     | 작성자 ID       |
| created_at         | timestamp with time zone | 생성 시간       |
| updated_at         | timestamp with time zone | 수정 시간       |

## 채권 회수 활동 테이블 (test_recovery_activities)

| 컬럼명        | 데이터 타입              | 설명        |
| ------------- | ------------------------ | ----------- |
| id            | uuid                     | 고유 식별자 |
| case_id       | uuid                     | 사건 ID     |
| activity_type | character varying(100)   | 활동 유형   |
| date          | date                     | 활동일      |
| description   | text                     | 설명        |
| notes         | text                     | 비고        |
| amount        | numeric                  | 금액        |
| status        | text                     | 상태        |
| file_url      | text                     | 파일 URL    |
| created_by    | uuid                     | 작성자 ID   |
| created_at    | timestamp with time zone | 생성 시간   |
| updated_at    | timestamp with time zone | 수정 시간   |

## 일정 테이블 (test_schedules)

| 컬럼명         | 데이터 타입              | 설명        |
| -------------- | ------------------------ | ----------- |
| id             | uuid                     | 고유 식별자 |
| title          | text                     | 제목        |
| event_type     | text                     | 일정 유형   |
| event_date     | timestamp with time zone | 일정일시    |
| end_date       | timestamp with time zone | 종료일시    |
| case_id        | uuid                     | 사건 ID     |
| lawsuit_id     | uuid                     | 소송 ID     |
| location       | text                     | 장소        |
| description    | text                     | 설명        |
| is_important   | boolean                  | 중요 여부   |
| is_completed   | boolean                  | 완료 여부   |
| court_name     | text                     | 법원명      |
| case_number    | text                     | 사건번호    |
| related_entity | text                     | 관련 엔티티 |
| related_id     | uuid                     | 관련 ID     |
| color          | text                     | 색상        |
| created_by     | uuid                     | 작성자 ID   |
| created_at     | timestamp with time zone | 생성 시간   |
| updated_at     | timestamp with time zone | 수정 시간   |

## 사용자 테이블 (users)

| 컬럼명        | 데이터 타입              | 설명          |
| ------------- | ------------------------ | ------------- |
| id            | uuid                     | 고유 식별자   |
| email         | text                     | 이메일        |
| name          | text                     | 이름          |
| phone_number  | text                     | 전화번호      |
| birth_date    | date                     | 생년월일      |
| gender        | text                     | 성별          |
| role          | text                     | 역할          |
| nickname      | text                     | 닉네임        |
| profile_image | text                     | 프로필 이미지 |
| position      | text                     | 직위          |
| employee_type | text                     | 직원 유형     |
| created_at    | timestamp with time zone | 생성 시간     |
