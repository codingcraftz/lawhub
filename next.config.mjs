import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  customWorkerDir: "worker", // 커스텀 워커 디렉토리 설정
});

export default withPWA({
  // Your Next.js config
});
