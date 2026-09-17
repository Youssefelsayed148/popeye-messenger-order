export const brand = {
  name: "Popeye",
  tagline: "اطلب من الماسنجر",
  colors: {
    sauce: {
      DEFAULT: "#DC1F26",
      dark: "#B01218",
      light: "#E4574E",
    },
    mustard: {
      DEFAULT: "#F4B942",
      dark: "#B87F26",
    },
    ink: "#1A1A1A",
    paper: "#FFFFFF",
  },
  fonts: {
    body: "Cairo",
    display: "Bebas Neue",
  },
} as const;

export type BrandColors = typeof brand.colors;