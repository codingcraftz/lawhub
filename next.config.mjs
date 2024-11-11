import nextPwa from "next-pwa";

/** @type {import('next').NextConfig} */
const nextConfig = {};

const withPWA = nextPwa({
  dest: "public",
  register: true,
  skipWaiting: true,
  // disable: process.env.NODE_ENV === 'development'
  // customWorkerDir: "worker",
  // runtimeCaching,
});

const config = withPWA({
  ...nextConfig,
});

export default config;
