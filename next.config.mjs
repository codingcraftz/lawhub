// next.config.mjs

import withPWA from "next-pwa";

const isProd = process.env.NODE_ENV === "production"; // 배포 버전에만 PWA 활성화

const pwaConfig = withPWA({
  dest: "public",
  // disable: !isProd,
  runtimeCaching: [],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* ... */
};

export default pwaConfig(nextConfig);
