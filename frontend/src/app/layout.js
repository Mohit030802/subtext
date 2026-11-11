import "./globals.css";
import { ThemeProvider } from "@/lib/theme";
import { SessionProvider } from "next-auth/react";

export const metadata = {
  title: "Subtext — AI Contract Intelligence",
  description: "Read between the lines. AI-powered contract analysis and lifecycle management.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body style={{ fontFamily: "var(--font-inter)" }}>
        <SessionProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
