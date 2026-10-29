/** @type {import('next').NextConfig} */
const nextConfig = {
  // @repo/core ships TypeScript source (shared with the Expo app)
  transpilePackages: ["@repo/core"],
};

export default nextConfig;
