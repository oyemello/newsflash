/** @type {import('next').NextConfig} */
const isPages = process.env.NEXT_PUBLIC_IS_PAGES === '1';
module.exports = {
  ...(isPages ? { output: 'export', basePath: '/newsflash', assetPrefix: '/newsflash/' } : {}),
  reactStrictMode: true,
};
