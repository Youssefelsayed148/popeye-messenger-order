/** @type {import('next').NextConfig} */
const supabaseHost = (url) => {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHostname = supabaseUrl ? supabaseHost(supabaseUrl) : null;

const remotePatterns = [
  { protocol: "https", hostname: "*.supabase.co" },
  { protocol: "https", hostname: "*.supabase.in" },
];
if (supabaseHostname) {
  remotePatterns.push({ protocol: "https", hostname: supabaseHostname });
}

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns,
  },
};

export default nextConfig;
