import type { Metadata } from "next";
import { Cormorant_Garamond, Inter, Montserrat } from "next/font/google";
import { icons } from "@/lib/assets";
import "./globals.css";
import "./story.css";
import "./ceremony.css";
import "./chrome.css";
import "./invite.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400"],
});

export const metadata: Metadata = {
  title: "Philia SocialFit",
  description: "A private layer for the city. SocialFit is invite-only.",
  manifest: icons.manifest,
  icons: {
    icon: [
      { url: icons.favicon16, sizes: "16x16", type: "image/png" },
      { url: icons.favicon32, sizes: "32x32", type: "image/png" },
    ],
    apple: icons.appleTouch,
    shortcut: icons.favicon,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${montserrat.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
