/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  transpilePackages: [
    'three',
    '@react-three/fiber',
    '@react-three/drei',
    '@react-three/postprocessing',
  ],
}

export default nextConfig
