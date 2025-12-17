import type { Metadata } from "next";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { ThemeProvider } from "@/lib/theme";
import ThemeBody from "./ThemeBody";
import { ToastProvider } from "@/components/common/Toast";
import { TooltipProvider } from "@/components/common/Tooltip";

export const metadata: Metadata = {
  title: "Xandeum P-Node Analytics",
  description: "Real-time monitoring for Xandeum Provider Nodes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <ThemeProvider>
        <ThemeBody>
          <ToastProvider>
            <TooltipProvider>
              {children}
            </TooltipProvider>
          </ToastProvider>
        </ThemeBody>
      </ThemeProvider>
    </html>
  );
}
