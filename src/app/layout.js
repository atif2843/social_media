import "./globals.css";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import Navigation from "@/components/Navigation";
import Providers from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Social Media Management",
  description: "Manage and schedule your social media posts",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-gray-50/50">
            <Navigation />
            {/* Main content area */}
            <main className="min-h-screen lg:pl-[var(--sidebar-width)] transition-all duration-300">
              {/* Main content with top padding for header */}
              <div className="pt-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                  {children}
                </div>
              </div>
            </main>
            <Toaster />
          </div>
        </Providers>
      </body>
    </html>
  );
}
