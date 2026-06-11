import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AmplifyProvider } from "@/components/AmplifyProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Engineering Assessment | Invaluable",
  description: "Engineering competency assessment tool for the Invaluable frontend team",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AmplifyProvider>{children}</AmplifyProvider>
      </body>
    </html>
  );
}
