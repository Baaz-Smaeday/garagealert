import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import './globals.css'

export const metadata: Metadata = {
  title: 'GarageAlert — Automated Customer Reminders for UK Garages',
  description: 'Send MOT, service, tyre, and repair reminders to your customers via SMS, WhatsApp, and email.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1f2937',
              color: '#f9fafb',
              fontSize: '14px',
            },
          }}
        />
      </body>
    </html>
  )
}
