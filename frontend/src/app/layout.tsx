import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/lib/ThemeContext'

export const metadata: Metadata = {
  title: 'SpaceGuard — Satellite Collision Risk Intelligence',
  description:
    'Real-time satellite conjunction detection and financial risk hedging dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body style={{ overflow: 'hidden', margin: 0 }}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
