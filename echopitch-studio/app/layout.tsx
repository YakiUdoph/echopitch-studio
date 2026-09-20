import type { Metadata } from "next";
import { ThemeProvider } from "./components/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "EchoPitch — Verified software stories",
  description: "Turn repository evidence into a claim-locked pitch and produced scene sequence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full bg-zinc-950 text-zinc-100">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
