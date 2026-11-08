import type { NextConfig } from "next";

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.rollbar.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const questionImagePattern = supabaseUrl
  ? new URL("/storage/v1/object/public/exam-question-images/**", supabaseUrl)
  : null;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
  images: { remotePatterns: questionImagePattern ? [questionImagePattern] : [] },
  // node-tikzjax runs TeX as WebAssembly and reads its engine dump and fonts from its own folder at runtime.
  serverExternalPackages: ["node-tikzjax"],
  outputFileTracingIncludes: {
    "/api/admin/materials/tikz": ["./node_modules/node-tikzjax/tex/**/*", "./node_modules/node-tikzjax/css/bakoma/ttf/**/*"],
    // Saving a module/submodule/topic draws its TikZ figures in the page's Server Action (lib/latex/tikz-store.ts).
    "/admin/lessons": ["./node_modules/node-tikzjax/tex/**/*", "./node_modules/node-tikzjax/css/bakoma/ttf/**/*"],
    "/admin/lessons/**": ["./node_modules/node-tikzjax/tex/**/*", "./node_modules/node-tikzjax/css/bakoma/ttf/**/*"],
  },
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "Content-Security-Policy", value: contentSecurityPolicy },
        { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
      ],
    }];
  },
};

export default nextConfig;
