/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  distDir: "dist",
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_ERXES_ENDPOINT: "https://producttest.next.erxes.io/gateway/graphql",
    NEXT_PUBLIC_ERXES_APP_TOKEN: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbGllbnRQb3J0YWxJZCI6IlZSSUwyMXk3UWh6UnprSzhuREVnTSIsImlhdCI6MTc3NzIxNDgyMn0.SnhaksTCrmc5dpum0X7IVRKtu5INLM18KAhj18u7WUw",
    NEXT_PUBLIC_ERXES_CMS_ID: "69ee261cd5623e433fd4a8fa",
  },
};

export default nextConfig;
