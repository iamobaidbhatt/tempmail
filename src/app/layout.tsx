import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { cn } from '@/lib/utils';
import NextTopLoader from 'nextjs-toploader';


export const metadata: Metadata = {
  title: 'Mail Veil',
  description: 'Temporary Email Service with AI Summarization',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={cn('dark', GeistSans.variable, GeistMono.variable)}>
      <head />
      <body className="font-sans antialiased" suppressHydrationWarning>
        <NextTopLoader
          color="hsl(217 91% 60%)"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px hsl(217 91% 60%), 0 0 5px hsl(217 91% 60%)"
        />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
