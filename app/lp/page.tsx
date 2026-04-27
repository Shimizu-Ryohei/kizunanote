import type { Metadata } from "next";
import LandingPageScreen from "../components/landing-page-screen";

const title = "キズナノート";
const description = "大切な人のことは、キズナノートが覚えてる。";
const ogImage = {
  url: "/brand/lp-hero-eyecatch.png",
  width: 1366,
  height: 1324,
  alt: description,
};

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    images: [ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [ogImage],
  },
};

export default function LandingPage() {
  return <LandingPageScreen />;
}
