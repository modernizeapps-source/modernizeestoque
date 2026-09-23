import './globals.css'
import VigiaInatividade from './VigiaInatividade'
import LeitorGlobal from './LeitorGlobal'

export const metadata = {
  title: 'Estoque Mercadinho',
  description: 'Controle de estoque e vendas',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="grid-overlay" />
        <VigiaInatividade />
        <LeitorGlobal />
        {children}
      </body>
    </html>
  )
}
