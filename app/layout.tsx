import { Titillium_Web, Montserrat } from "next/font/google";
import Head from "next/head";
import "./globals.css";
import Footer from "@/components/ui/Footer";
import Header from "@/components/ui/Header";
import { RouteProgress } from "@/components/ui/route-progress";
import Script from "next/script";
import { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://market-minder.vercel.app"),
  title: {
    default: "MarkitMinder – Data-Driven Local Business Insights",
    template: "%s | MarkitMinder",
  },
  description:
    "MarkitMinder helps businesses analyse, compare, and rate local companies using real-world market and Google Maps data.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "https://market-minder.vercel.app",
    title: "MarkitMinder – Data-Driven Local Business Insights",
    description:
      "Analyse local businesses using real-world market data, reviews, and competitive insights.",
    siteName: "MarkitMinder",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MarkitMinder dashboard preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MarkitMinder – Local Business Analytics",
    description:
      "Discover market insights, competitor analysis, and local business ratings.",
    images: ["/og-image.png"],
  },
};

const titilliumWeb = Titillium_Web({
  weight: ["400", "600", "700"],
  display: "swap",
  subsets: ["latin"],
  variable: "--font-titillium-web",
});

const montserrat = Montserrat({
  weight: ["400", "600", "700"],
  display: "swap",
  subsets: ["latin"],
  variable: "--font-montserrat",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${titilliumWeb.variable} ${montserrat.variable}`} suppressHydrationWarning>
      <Head>
      <Script
          id="schema-software-app"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "MarkitMinder",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              url: "https://market-minder.vercel.app",
              description:
                "A SaaS platform for analysing, rating, and comparing local businesses using market and Google Maps data.",
              offers: {
                "@type": "Offer",
                price: "40",
                priceCurrency: "GBP",
              },
              softwareAddOn: [
                {
                  "@type": "SoftwareApplication",
                  name: "Market Analysis",
                  description: "Analyse the market for a local business",
                },
              ],
            }),
          }}
        />
      </Head>
      <body className="text-text bg-gradient-to-b from-background to-background-secondary flex flex-col align-middle items-center text-center">

        <div className="">
          <RouteProgress />
          <Header />
          {children}
          <Footer />
        </div>
      </body>
    </html>
  );
}
