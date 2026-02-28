import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "2020 Mercedes Sprinter 2500 Diesel High Roof Camper Van For Sale",
  description:
    "2020 Mercedes Sprinter 2500 3.0L Diesel High Roof 170 Extended WB adventure camper van. ARB Air Locker, 800Ah lithium power, premium off-road upgrades. Turn-key and ready for off-grid adventures.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
