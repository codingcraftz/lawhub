"use client";
import { useUser } from "@/hooks/useUser";
import { supabase } from "@/utils/supabase";
import { Box, Flex, Text, Avatar, Button } from "@radix-ui/themes";

const MyPage = () => {
  const { user, setUser } = useUser();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/login");
  };

  if (!user) {
    return <div>로그인이 필요합니다.</div>;
  }

  return (
    <Box className="my-auto" px="6" py="5">
      <Flex
        direction="column"
        gap="4"
        align="center"
        justify="center"
        style={{ maxWidth: "400px", margin: "0 auto" }}
      >
        <Avatar
          src={user.avatar_url || ""}
          fallback={user.name ? user.name[0] : "U"}
          size="6"
          radius="full"
        />
        <Text size="5" weight="bold">
          {user.name || "사용자 이름 없음"}
        </Text>
        <Box width="100%" border="1px solid var(--gray-5)" p="4">
          <Flex direction="column" gap="2">
            <Flex justify="between">
              <Text weight="bold">이메일:</Text>
              <Text>{user.email || "이메일 정보 없음"}</Text>
            </Flex>
            <Flex justify="between">
              <Text weight="bold">전화번호:</Text>
              <Text>{user.phone_number || "전화번호 정보 없음"}</Text>
            </Flex>
            <Flex justify="between">
              <Text weight="bold">생년월일:</Text>
              <Text>{user.birth_date || "생년월일 정보 없음"}</Text>
            </Flex>
            <Flex justify="between">
              <Text weight="bold">성별:</Text>
              <Text>
                {user.gender === "male"
                  ? "남성"
                  : user.gender === "female"
                    ? "여성"
                    : "정보 없음"}
              </Text>
            </Flex>
            <Flex justify="between">
              <Text weight="bold">권한:</Text>{" "}
              <Text>
                {user.role === "admin"
                  ? "관리자"
                  : user.role === "staff"
                    ? "직원"
                    : user.role === "client"
                      ? "고객"
                      : "권한 정보 없음"}
              </Text>
            </Flex>
            <Flex justify="between">
              <Text weight="bold">가입일:</Text>
              <Text>
                {new Date(user.created_at).toLocaleDateString("ko-KR") ||
                  "가입일 정보 없음"}
              </Text>
            </Flex>
          </Flex>
        </Box>
        <Button variant="solid" color="red" size="large" onClick={handleLogout}>
          로그아웃
        </Button>
      </Flex>
    </Box>
  );
};

export default MyPage;
