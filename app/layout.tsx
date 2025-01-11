import "./globals.css"
import { JetBrains_Mono } from 'next/font/google'
import { cn } from "@/lib/utils"
import type { Metadata } from 'next'

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: 'Debug Patterns',
  description: 'Explore common debugging patterns with ready to copy code to improve your development workflow.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark antialiased">
      <body className={cn(
        "min-h-screen font-mono antialiased bg-background text-foreground",
        jetbrainsMono.variable
      )}>
        <div className="relative flex min-h-screen flex-col">
          <main className="flex-1">
            <div className="container relative mx-auto py-6 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
              {children}
            </div>
          </main>
          <footer className="w-full py-6 text-center border-t border-border">
            <p className="text-sm text-muted-foreground">
              Made with ❤️ by Silo-22
            </p>
          </footer>
        </div>
      </body>
    </html>
  )
}
