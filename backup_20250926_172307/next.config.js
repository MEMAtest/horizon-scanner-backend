/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Exclude Node.js modules from client-side bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        dns: false,
        tls: false,
        fs: false,
        http: false,
        https: false,
        stream: false,
        crypto: false,
        os: false,
        path: false,
        zlib: false,
        querystring: false,
        url: false,
        util: false
      };
    }
    return config;
  },
};

module.exports = nextConfig;