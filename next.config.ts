import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bật instrumentation hook cho license scheduler
  experimental: {
  },
  // Cho phép dev resources qua domain deploy (chỉ có tác dụng ở chế độ dev).
  allowedDevOrigins: ["*.up.railway.app", "*.railway.app"],
  // Bảo vệ: không expose source maps ra production
  productionBrowserSourceMaps: false,
  // Headers bảo mật
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
