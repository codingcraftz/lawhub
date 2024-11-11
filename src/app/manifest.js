export default function manifest() {
  return {
    name: "Pwa",
    short_name: "PWA TODO",
    theme_color: "#f5f5f5",
    background_color: "#f5f5f5",
    icons: [
      {
        src: "LawHub_Logo_192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "LawHub_Logo_512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    orientation: "any",
    display: "standalone",
    dir: "auto",
    lang: "ko-KR",
    start_url: "/",
  };
}
