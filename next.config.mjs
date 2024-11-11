import withPWA from "next-pwa";

const isProd = process.env.NODE_ENV === "production";

export default withPWA({
  dest: "public", // 빌드 후 생성된 PWA 파일이 저장될 위치
  disable: !isProd, // 개발 환경에서는 PWA 비활성화
  register: true,
  skipWaiting: true,
  reactStrictMode: true,
});
