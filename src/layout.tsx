import { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin', 'hebrew'] })

export const metadata: Metadata = {
  title: {
    template: '%s | מינרל גז',
    default: 'מערכת הזמנות מינרל גז', // Default title
  },
  description: 'הזמינו בלוני גז איכותיים ממינרל גז. מבחר עשיר של בלוני גז, שירותי התקנה ותחזוקה.',
  keywords: ['בלוני גז', 'הזמנות גז', 'מינרל גז', 'גז', 'בלונים', 'התקנה'],
  authors: [{ name: 'Mineral Gas' }],
  creator: 'Mineral Gas',
  publisher: 'Mineral Gas',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://mineralgas.com'), // Replace with your actual domain
  openGraph: {
    title: 'מערכת הזמנות מינרל גז',
    description: 'הזמינו בלוני גז איכותיים ממינרל גז. מבחר עשיר של בלוני גז, שירותי התקנה ותחזוקה.',
    url: 'https://mineralgas.com',
    siteName: 'מינרל גז',
    locale: 'he_IL',
    type: 'website',
    images: [
      {
        url: '/images/og-image.jpg', // Replace with your actual OG image path
        width: 1200,
        height: 630,
        alt: 'מינרל גז - בלוני גז איכותיים ושירותי התקנה',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'מערכת הזמנות מינרל גז',
    description: 'הזמינו בלוני גז איכותיים ממינרל גז',
    images: ['/images/og-image.jpg'], // Same as OG image
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl">
      <body className={inter.className}>{children}</body>
    </html>
  )
} 