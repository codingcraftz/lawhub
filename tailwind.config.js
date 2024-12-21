module.exports = {
  darkMode: "class", // Tailwind 다크모드 활성화
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gray: generateScale("gray"),
        slate: generateScale("slate"),
        violet: generateScale("violet"),
        mauve: generateScale("mauve"),
        green: generateScale("green"),
        red: generateScale("red"),
        blue: generateScale("blue"),
        sky: generateScale("sky"),
        orange: generateScale("orange"),
        yellow: generateScale("yellow"),
        tomato: generateScale("tomato"),
      },
      keyframes: {
        overlayShow: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        contentShow: {
          from: {
            opacity: "0",
            transform: "translate(-50%, -48%) scale(0.96)",
          },
          to: { opacity: "1", transform: "translate(-50%, -50%) scale(1)" },
        },
      },
      animation: {
        overlayShow: "overlayShow 150ms cubic-bezier(0.16, 1, 0.3, 1)",
        contentShow: "contentShow 150ms cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

// Radix Colors의 CSS 변수를 Tailwind 색상으로 변환
function generateScale(name) {
  const scale = Array.from({ length: 12 }, (_, i) => {
    const id = i + 1;
    return [
      [id, `var(--${name}-${id})`], // 예: --gray1
    ];
  }).flat();

  return Object.fromEntries(scale); // 객체 형태로 변환
}
