import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "キズナノート",
    short_name: "キズナノート",
    description: "大切なつながりを記録するキュレーションノート",
    start_url: "/home",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      {
        src: "/brand/kizunanote-home.png",
        sizes: "2000x2000",
        type: "image/png",
      },
    ],
  };
}
