import type { Metadata } from "next";
import { Cairo, Bebas_Neue } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700"],
  variable: "--font-cairo",
  display: "swap",
});

const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Popeye — اطلب من الماسنجر",
  description: "اطلب من مين؟ من باباي.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${cairo.variable} ${bebasNeue.variable}`}
    >
      <body className="min-h-screen bg-cream font-sans text-ink antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}