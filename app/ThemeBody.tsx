"use client";

import { useTheme } from "@/lib/theme";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function ThemeBody({
  children,
}: {
  children: React.ReactNode;
}) {
  const { themeId } = useTheme();

  return (
    <body
      className={`${geistSans.variable} ${geistMono.variable} antialiased ${themeId}`}
    >
      {children}
    </body>
  );
}
