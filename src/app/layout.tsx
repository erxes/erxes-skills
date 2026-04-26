import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ApolloClientProvider from "@/lib/apollo/provider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Улаанбаатар Буян - Дурсгалын үйлчилгээ",
  description: "Улаанбаатар Буян - Дурсгалын үйлчилгээ, үйлчилгээний төв",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="mn"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ApolloClientProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </ApolloClientProvider>
      </body>
    </html>
  );
}
