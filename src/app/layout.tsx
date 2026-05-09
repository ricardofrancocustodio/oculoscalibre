import type { Metadata, Viewport } from "next";
import { Bebas_Neue, DM_Sans, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { jsonLdScript, organizationSchema, websiteSchema } from "@/lib/json-ld";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://oculoscalibre.vercel.app";
const SITE_NAME = "Calibre";
const HOME_TITLE = "Calibre MB-1572S — óculos de sol para rosto largo (até 158mm)";
const HOME_DESCRIPTION =
  "Lista de espera do MB-1572S: óculos de sol em acetato premium com 150,7mm de frontal. Para quem nunca encontrou armação confortável em rostos largos. Reserva grátis e sem compromisso.";
const OG_IMAGE_PATH = "/og-default.jpg";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: HOME_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: HOME_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  keywords: [
    "óculos de sol para rosto largo",
    "óculos masculino rosto grande",
    "MB-1572S",
    "Calibre óculos",
    "armação acetato premium",
    "óculos 150mm frontal",
    "UV400",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: SITE_NAME,
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    images: [
      {
        url: OG_IMAGE_PATH,
        width: 1200,
        height: 630,
        alt: "Calibre MB-1572S — óculos de sol para rosto largo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    images: [OG_IMAGE_PATH],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
  },
  formatDetection: {
    email: false,
    telephone: false,
  },
  category: "shopping",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0A0A0A",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} ${bebasNeue.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript([organizationSchema(), websiteSchema()]) }}
        />
        {children}
      </body>
    </html>
  );
}
