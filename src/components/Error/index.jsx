const { Box, Card, Flex, Button, Text } = require("@radix-ui/themes");
const { default: Link } = require("next/link");

const ErrorPage = () => {
  return (
    <Box className="flex justify-center items-center min-h-screen px-4 sm:px-6 md:px-8">
      <Card className="w-full max-w-md p-6 sm:p-8 md:p-10 lg:w-1/3">
        <Flex direction="column" align="center" gap="3">
          <Text size="5" weight="bold">
            회원만 이용가능한 페이지입니다.
          </Text>
          <Box className="flex justify-center gap-2 mt-2">
            <Link href="/login">
              <Button>로그인</Button>
            </Link>
            <Link href="/signup">
              <Button>회원가입</Button>
            </Link>
          </Box>
        </Flex>
      </Card>
    </Box>
  );
};
export default ErrorPage;
