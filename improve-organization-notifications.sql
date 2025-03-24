-- 기존 함수를 대체하는 새 함수 정의
CREATE OR REPLACE FUNCTION get_organization_notifications(p_user_id UUID, p_org_id UUID)
RETURNS SETOF test_individual_notifications AS $$
  SELECT DISTINCT n.*
  FROM test_individual_notifications n
  JOIN test_case_clients c ON n.case_id = c.case_id
  LEFT JOIN test_organization_members om ON om.organization_id = p_org_id AND om.user_id = p_user_id
  LEFT JOIN test_case_handlers h ON n.case_id = h.case_id AND h.user_id = p_user_id
  WHERE 
    n.user_id = p_user_id
    AND c.client_type = 'organization'
    AND c.organization_id = p_org_id
    AND (
      -- 사용자가 해당 법인의 멤버이거나
      om.id IS NOT NULL 
      -- 또는 사용자가 해당 사건의 핸들러이거나
      OR h.id IS NOT NULL
    )
  ORDER BY n.created_at DESC;
$$ LANGUAGE sql;

-- 함수에 대한 설명 추가
COMMENT ON FUNCTION get_organization_notifications(UUID, UUID) IS '특정 사용자와 조직에 관련된 알림만 가져오는 함수입니다. 사용자 ID와 조직 ID를 매개변수로 받습니다.'; 