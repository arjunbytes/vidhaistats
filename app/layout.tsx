import "./globals.css";
import type { Metadata } from "next";
import { Providers } from "./providers";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";

export const metadata: Metadata = {
  title: "Vidhai Application Tracker",
  description: "Day to Day Vidhai Application Status — Agaram Foundation",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="flex h-screen w-full overflow-hidden bg-[#F5F5F5]">
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
              <TopBar />
              <main className="flex-1 overflow-y-auto px-8 py-6">{children}</main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
