import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Uploads de imagens na board de marketing (Postagem de conteúdo) passam
    // pelo server action, por isso o body limit (default 1 MB) tem de subir.
    // 12 MB cobre o limite de 10 MB validado em marketing-actions.ts.
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
