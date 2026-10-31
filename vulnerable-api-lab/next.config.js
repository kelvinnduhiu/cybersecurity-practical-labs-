/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false // we deliberately re-expose detailed errors elsewhere (API8) but no need to leak the framework banner here
};

module.exports = nextConfig;
