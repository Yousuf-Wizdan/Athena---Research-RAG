import type { Metadata } from "next";
import { Fraunces, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  axes: ["SOFT", "WONK"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: {
    default: "Athena",
    template: "%s | Athena",
  },
  description:
    "Athena is an elite literature synthesis engine and agentic RAG platform. Accelerate your academic research, contrast methodologies, and extract structured insights from your paper repository.",
  keywords: [
    "RAG",
    "Agentic RAG",
    "LangGraph",
    "Qdrant",
    "Academic Research",
    "Literature Synthesis",
    "AI Research Assistant",
  ],
  authors: [{ name: "Athena Team" }],
  creator: "Athena Team",
  publisher: "Athena Team",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://athena-research.vercel.app",
    title: "Athena — Agentic RAG Platform",
    description:
      "Athena is an elite literature synthesis engine and agentic RAG platform. Accelerate your academic research, contrast methodologies, and extract structured insights.",
    siteName: "Athena",
  },
  twitter: {
    card: "summary_large_image",
    title: "Athena — Agentic RAG Platform",
    description:
      "Athena is an elite literature synthesis engine and agentic RAG platform. Accelerate your academic research, contrast methodologies, and extract structured insights.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${fraunces.variable} ${dmSans.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
