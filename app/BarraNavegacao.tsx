'use client'

import { useIsDesktop } from '@/lib/useIsDesktop'
import NavCelular from './NavCelular'

// No celular mostra a barra fixa no rodapé. No computador não mostra nada —
// lá a navegação é a barra do topo, que cada tela já desenha.
export default function BarraNavegacao() {
  const isDesktop = useIsDesktop()
  if (isDesktop) return null
  return <NavCelular />
}
