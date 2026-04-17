/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only use static export for production build (Firebase hosting).
  // output: 'export' can cause 404 on root route in dev server (Next.js 14).
  ...(process.env.NODE_ENV === 'production' ? { output: 'export' } : {}),
  transpilePackages: [
    'three',
    '@react-three/fiber',
    '@react-three/drei',
    '@react-three/postprocessing',
  ],
}

export default nextConfig
