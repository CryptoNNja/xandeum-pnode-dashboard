import type { Metadata } from "next";
import "./globals.css";
import '@/lib/suppress-warnings';
import "leaflet/dist/leaflet.css";
import { ThemeProvider } from "@/lib/theme";
import ThemeBody from "./ThemeBody";
import { ToastProvider } from "@/components/common/Toast";
import { TooltipProvider } from "@/components/common/Tooltip";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ChatbotWidget } from "@/components/Chat";
import { STOINCCalculatorWidget } from "@/components/STOINCCalculator";
import { DashboardProvider } from "@/lib/dashboard-context";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

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
          <ErrorBoundary>
            <ToastProvider>
              <TooltipProvider>
                <DashboardProvider>
                  {children}
                  <STOINCCalculatorWidget />
                  <ChatbotWidget />
                </DashboardProvider>
              </TooltipProvider>
            </ToastProvider>
          </ErrorBoundary>
          <Analytics />
          <SpeedInsights />
        </ThemeBody>
      </ThemeProvider>
    </html>
  );
}
