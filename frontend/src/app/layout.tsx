import type { Metadata } from 'next'
import './globals.css'

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
    <html lang="en">
      <body style={{ background: '#020817', overflow: 'hidden', margin: 0 }}>
        {children}
      </body>
    </html>
  )
}
