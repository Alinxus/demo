/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    WHISPER_API_KEY: process.env.WHISPER_API_KEY,
    WHISPER_API_BASE_URL: process.env.WHISPER_API_BASE_URL || 'http://localhost:4000',
  },
};

export default nextConfig;
