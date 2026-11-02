import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const viewport: Viewport = {
  themeColor: "#102C46",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "Anil Sharma Dental Hospital | Gentle, Professional Dental Care",
    template: "%s | Anil Sharma Dental Hospital",
  },
  description:
    "Anil Sharma Dental Hospital (also known as A.K. Sharma Dental Hospital) provides comprehensive, patient-centered dental care with a focus on gentleness, sterilization, and precision restorations.",
  keywords: [
    "Anil Sharma Dental Hospital",
    "AK Sharma Dental Hospital",
    "dental clinic",
    "dentist",
    "root canal treatment",
    "dental implants",
    "dental crowns",
    "teeth whitening",
    "teeth cleaning",
  ],
  authors: [{ name: "Anil Sharma Dental Hospital" }],
  creator: "Anil Sharma Dental Hospital",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/",
    siteName: "Anil Sharma Dental Hospital",
    title: "Anil Sharma Dental Hospital | Gentle, Professional Dental Care",
    description:
      "Modern, hygienic dental clinic providing complete oral healthcare for families with clinical precision and gentle care.",
    images: [
      {
        url: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=1200&auto=format&fit=crop",
        width: 1200,
        height: 630,
        alt: "Anil Sharma Dental Hospital Operatory",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Anil Sharma Dental Hospital | Gentle, Professional Dental Care",
    description:
      "Modern, hygienic dental clinic providing complete oral healthcare for families with clinical precision and gentle care.",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth antialiased">
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-[#F8FAFC] text-[#172B3A]">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#102C46",
              color: "#FFFFFF",
              borderRadius: "12px",
              fontSize: "14px",
            },
          }}
        />
      </body>
    </html>
  );
}
