import type { NextConfig } from "next";
const config: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "media.giphy.com" },
      { protocol: "https", hostname: "i.giphy.com" },
    ],
  },
};
export default config;
