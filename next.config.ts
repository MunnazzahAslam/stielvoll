import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {};

// Loads src/i18n/request.ts for every request.
export default createNextIntlPlugin()(nextConfig);
