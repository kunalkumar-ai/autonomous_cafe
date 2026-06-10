import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Brew & Bits — Autonomous Cafe',
  description: 'Fully autonomous 3D AI cafe simulation',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
