/** @type {import('next').NextConfig} */
const nextConfig = {
    // output: 'export',
    transpilePackages: ['@douyinfe/semi-ui', '@douyinfe/semi-icons', '@douyinfe/semi-illustrations'],
    reactStrictMode: false,
}

module.exports = nextConfig
