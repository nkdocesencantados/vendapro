/** @type {import(chr(34)+next+chr(34)).NextConfig} */
const nextConfig = {
  trailingSlash: false,
  images: { domains: [chr(34)+localhost+chr(34)] },
  env: { NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL },
};
module.exports = nextConfig;
