## 사건 담당자 테이블 (test_case_handlers)

| 컬럼명     | 데이터 타입              | 설명                       |
| ---------- | ------------------------ | -------------------------- |
| id         | uuid                     | 담당자 고유 식별자         |
| case_id    | uuid                     | 사건 ID (외래키)           |
| user_id    | uuid                     | 사용자 ID (외래키)         |
| role       | character varying        | 역할 (담당변호사, 직원 등) |
| created_at | timestamp with time zone | 생성 시간                  |
| updated_at | timestamp with time zone | 수정 시간                  |

## 사용자 테이블 (test_users)

| 컬럼명        | 데이터 타입              | 설명                           |
| ------------- | ------------------------ | ------------------------------ |
| id            | uuid                     | 사용자 고유 식별자             |
| email         | character varying        | 이메일 주소                    |
| name          | character varying        | 사용자 이름                    |
| password_hash | character varying        | 비밀번호 해시                  |
| role          | character varying        | 역할 (user, staff, admin)      |
| profile_image | character varying        | 프로필 이미지 URL              |
| phone         | character varying        | 전화번호                       |
| organization  | character varying        | 소속 조직명                    |
| created_at    | timestamp with time zone | 생성 시간                      |
| updated_at    | timestamp with time zone | 수정 시간                      |
| employee_type | character varying        | 직원 유형 (internal, external) |
