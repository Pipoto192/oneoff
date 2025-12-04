/** @type {import('next').NextConfig} */
const isCapacitor = process.env.NEXT_PUBLIC_IS_CAPACITOR === 'true';

const nextConfig = {
  output: isCapacitor ? 'export' : undefined,
  images: {
    unoptimized: true // Always true for now to be safe, or conditional if you prefer
  }
};

export default nextConfig;
