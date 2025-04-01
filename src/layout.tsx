import { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin', 'hebrew'] })

export const metadata: Metadata = {
  title: {
    template: '%s | מאפיית אורבר',
    default: 'מערכת הזמנות מאפיית אורבר', // Default title
  },
  description: 'הזמינו מוצרי מאפייה טריים ואיכותיים ממאפיית אורבר. מבחר עשיר של לחמים, מאפים, עוגות ומוצרי מאפייה מיוחדים.',
  keywords: ['מאפייה', 'הזמנות אוכל', 'לחם', 'מאפים', 'עוגות', 'אורבר', 'מאפיית אורבר'],
  authors: [{ name: 'Orber Bakery' }],
  creator: 'Orber Bakery',
  publisher: 'Orber Bakery',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://orberbakery.com'), // Replace with your actual domain
  openGraph: {
    title: 'מערכת הזמנות מאפיית אורבר',
    description: 'הזמינו מוצרי מאפייה טריים ואיכותיים ממאפיית אורבר. מבחר עשיר של לחמים, מאפים, עוגות ומוצרי מאפייה מיוחדים.',
    url: 'https://orberbakery.com',
    siteName: 'מאפיית אורבר',
    locale: 'he_IL',
    type: 'website',
    images: [
      {
        url: '/images/og-image.jpg', // Replace with your actual OG image path
        width: 1200,
        height: 630,
        alt: 'מאפיית אורבר - מוצרי מאפייה טריים ואיכותיים',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'מערכת הזמנות מאפיית אורבר',
    description: 'הזמינו מוצרי מאפייה טריים ואיכותיים ממאפיית אורבר',
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