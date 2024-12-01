import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./styles/globals.css"
import { AuthProvider } from '@/contexts/AuthContext'
import Navigation from '@/components/Navigation'

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Hermes Inventory Tracker",
  description: "Track Hermes inventory in real-time",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <Navigation />
          <main className="min-h-screen bg-gray-50">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  )
} 