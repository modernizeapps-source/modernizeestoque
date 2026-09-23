'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useLeitorCodigoBarras } from '@/lib/useLeitorCodigoBarras'

// Deixa o leitor de código de barras funcionar em qualquer tela: bipou um
// produto, o sistema abre a Venda já com ele no carrinho. Nas telas de Venda e
// de cadastro de produto o leitor é tratado localmente, então aqui ele folga.
const TELAS_QUE_JA_TRATAM = ['/venda', '/produtos/novo']

export default function LeitorGlobal() {
  const router = useRouter()
  const pathname = usePathname()

  const ehTelaPropria =
    TELAS_QUE_JA_TRATAM.some((t) => pathname === t) ||
    pathname.startsWith('/produtos/')

  useLeitorCodigoBarras((codigo) => {
    // Manda o código na URL; a tela de Venda cuida de achar o produto,
    // somar ao carrinho e avisar se o código não existir.
    router.push(`/venda?codigo=${encodeURIComponent(codigo)}`)
  }, !ehTelaPropria && pathname !== '/login')

  return null
}
