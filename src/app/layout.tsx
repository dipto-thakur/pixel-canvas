import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "pc2 sandbox",
  description: "Isolated runner for the PixelCanvas (pc2) component",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
